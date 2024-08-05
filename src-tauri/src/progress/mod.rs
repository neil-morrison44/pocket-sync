use serde::{Deserialize, Serialize};
use work_unit_group::WorkUnitGroupStatus;
mod work_unit_group;

type EmitCallback<'a> = Box<dyn FnMut(ProgressEvent) + Send + 'a>;
pub struct ProgressEmitter<'a> {
    work_unit_stack: Vec<WorkUnitGroupStatus>,
    message: Option<ProgressMessage>,
    emit_callback: EmitCallback<'a>,
}

impl<'a> ProgressEmitter<'a> {
    pub fn new(callback: EmitCallback<'a>) -> Self {
        ProgressEmitter {
            work_unit_stack: vec![WorkUnitGroupStatus::new(10)],
            message: None,
            emit_callback: callback,
        }
    }

    pub fn begin_work_units(self: &mut Self, count: usize) -> () {
        self.work_unit_stack.push(WorkUnitGroupStatus::new(count));
    }

    pub fn complete_work_units(self: &mut Self, units: usize) -> () {
        let mut remaining_units = units;

        while let Some(overflow) = self
            .work_unit_stack
            .last_mut()
            .and_then(|s| s.complete_work_units(remaining_units))
        {
            remaining_units = overflow;
            self.work_unit_stack.push(WorkUnitGroupStatus::new(10));
        }

        self.emit_progress();
    }

    pub fn set_message(self: &mut Self, token: &str, param: Option<&str>) -> () {
        self.message = Some(ProgressMessage {
            token: String::from(token),
            param: param.and_then(|p| Some(String::from(p))),
        });

        self.emit_progress();
    }

    fn emit_progress(self: &mut Self) -> () {
        let event = ProgressEvent {
            finished: false,
            progress: self.overall_percentage(),
            message: self.message.clone(),
        };

        (self.emit_callback)(event);
    }

    fn overall_percentage(self: &Self) -> f32 {
        let mut percent = 0.0;
        for work_unit in &self.work_unit_stack {
            let remainder = 1.0 - percent;
            percent += work_unit.fraction() * remainder;
        }
        percent
    }
}

impl Drop for ProgressEmitter<'_> {
    fn drop(&mut self) {
        let event = ProgressEvent {
            finished: true,
            progress: self.overall_percentage(),
            message: self.message.clone(),
        };
        (self.emit_callback)(event);
    }
}

impl Default for ProgressEmitter<'_> {
    fn default() -> Self {
        Self {
            work_unit_stack: Default::default(),
            message: Default::default(),
            emit_callback: Box::new(|_e| {}),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProgressMessage {
    token: String,
    param: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProgressEvent {
    pub finished: bool,
    pub progress: f32,
    pub message: Option<ProgressMessage>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use anyhow::Result;

    #[test]
    fn add_under_count() -> Result<()> {
        let mut progress_emitter = ProgressEmitter::new(Box::new(|_event| {}));
        progress_emitter.complete_work_units(5);

        assert_eq!(progress_emitter.overall_percentage(), 0.5);
        Ok(())
    }

    #[test]
    fn add_over_count() -> Result<()> {
        let mut progress_emitter = ProgressEmitter::new(Box::new(|_event| {}));
        progress_emitter.complete_work_units(25);

        assert_eq!(progress_emitter.overall_percentage(), 0.997);
        Ok(())
    }
}
