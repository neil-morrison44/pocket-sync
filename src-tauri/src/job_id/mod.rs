use anyhow::{Context, Result};
use serde::Serialize;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone, Default, Debug)]
pub struct JobState {
    inner: Arc<RwLock<InnerJobState>>,
}

#[derive(Default, Debug)]
struct InnerJobState {
    tasks: HashMap<String, Job>,
}

#[derive(Default, Clone, Debug, Serialize)]
pub struct Job {
    pub id: String,
    pub status: JobStatus,
}

#[derive(Default, Debug, Clone, Serialize)]
pub enum JobStatus {
    #[default]
    Running,
    Stopping,
}

pub struct JobHandle<'a> {
    job_id: String,
    state: &'a JobState,
}

impl JobState {
    pub async fn start_job(&self, key: &str) -> Arc<JobHandle<'_>> {
        let mut lock = self.inner.write().await;
        let id = String::from(key);
        let task = Job {
            id: id.clone(),
            status: JobStatus::Running,
        };
        lock.tasks.insert(id.clone(), task);

        Arc::new(JobHandle {
            job_id: id.clone(),
            state: &self,
        })
    }

    pub async fn get_status(&self, key: &str) -> Option<JobStatus> {
        let lock = self.inner.read().await;
        let task = lock.tasks.get(key);
        task.and_then(|t| Some(t.status.clone()))
    }

    pub fn remove_job(&self, key: &str) -> () {
        tokio::task::block_in_place(move || {
            let mut lock = self.inner.blocking_write();
            lock.tasks.remove(key);
        });
    }

    pub async fn stop_job(&self, key: &str) -> Result<()> {
        let mut lock = self.inner.write().await;
        let task = lock.tasks.get_mut(key).context("Stopping missing task")?;
        task.status = JobStatus::Stopping;

        Ok(())
    }

    pub async fn get_all_jobs(&self) -> Vec<Job> {
        let lock = self.inner.read().await;
        lock.tasks.values().cloned().collect()
    }
}

impl Drop for JobHandle<'_> {
    fn drop(&mut self) {
        self.state.remove_job(&self.job_id);
    }
}

impl JobHandle<'_> {
    pub async fn is_alive(&self) -> bool {
        match self.state.get_status(&self.job_id).await {
            Some(JobStatus::Running) => true,
            _ => false,
        }
    }
}
