use std::sync::Arc;
use std::{collections::HashMap, path::PathBuf};
use tokio::sync::RwLock;

#[derive(Default, Clone)]
pub struct ArcLock(Arc<RwLock<()>>);

impl ArcLock {
    pub fn is_readable(&self) -> bool {
        self.0.try_read().is_ok()
    }

    pub fn read(&self) -> impl futures::Future<Output = tokio::sync::RwLockReadGuard<'_, ()>> {
        self.0.read()
    }

    pub fn write(&self) -> impl futures::Future<Output = tokio::sync::RwLockWriteGuard<'_, ()>> {
        self.0.write()
    }
}

#[derive(Default)]
pub struct FileLocks(RwLock<HashMap<PathBuf, ArcLock>>);

impl FileLocks {
    pub async fn find_lock_for(&self, path: &PathBuf) -> ArcLock {
        {
            let file_locks = self.0.read().await;

            // work the way up ancestors, return the first one that currently can't be read
            if let Some(blocked_lock) = path
                .ancestors()
                .filter_map(|p| file_locks.get(&p.to_path_buf()))
                .find(|lock| !lock.is_readable())
            {
                return blocked_lock.clone();
            }
        }

        // failing that, create a lock for this path & add it to the hash
        {
            let mut file_locks = self.0.write().await;

            let new_lock = ArcLock::default();
            file_locks.insert(path.clone(), new_lock.clone());
            return new_lock;
        }
    }
}
