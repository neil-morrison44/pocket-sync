use anyhow::Result;
use std::sync::Arc;
use tokio::sync::mpsc;
use work_unit_group::WorkUnitGroupStatus;

mod work_unit_group;

#[derive(Debug)]
pub struct ProgressEmitter {
    work_unit_stack: Vec<WorkUnitGroupStatus>,
    // channel: Arc<ProgressEvent>,
    name: String,
    message: Option<ProgressMessage>,
}

impl ProgressEmitter {
    fn new(name: &str) -> Self {

let channel =



        ProgressEmitter {
            work_unit_stack: vec![WorkUnitGroupStatus::new(10)],
            name: String::from(name),
            message: None,
        }
    }

    fn overall_percentage(self: &Self) -> f32 {
        let mut percent = 0.0;
        for work_unit in &self.work_unit_stack {
            let remainder = 1.0 - percent;
            percent += work_unit.fraction() * remainder;
        }
        percent
    }

    fn complete_work_units(self: &mut Self, units: usize) -> () {
        let mut remaining_units = units;

        while let Some(overflow) = self
            .work_unit_stack
            .last_mut()
            .and_then(|s| s.complete_work_units(remaining_units))
        {
            remaining_units = overflow;
            self.work_unit_stack.push(WorkUnitGroupStatus::new(10));
        }

        dbg!(&self);
    }
}

#[derive(Debug)]
struct ProgressMessage {
    token: String,
    param: Option<String>,
}

pub enum ProgressEvent {
    Finish,
    CompleteWorkUnits(usize),
    BeginWorkUnits(usize),
    SetMessage(String, Option<String>),
}

// impl ProgressEmitter<'_> {
//     pub fn start(name: &str, initial_work_unit_count: usize, window: &'a tauri::Window) -> ProgressEmitter {
//         let (tx, mut rx) = mpsc::channel<ProgressEvent>(100);

//         let emitter = ProgressEmitter {
//             window: window,
//             work_unit_stack: vec![
//                 WorkUnitGroupStatus
//             ],
//             name: String::from(name),
//             channel: Arc::new(tx),
//             messages: None
//         };

//         // window
//         //     .emit(
//         //         "progress-start-event",
//         //         ProgressStartPayload { progress: 0.0 },
//         //     )
//         //     .unwrap();

//         return emitter;
//     }
// }

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn add_under_count() -> Result<()> {
        let mut progress_emitter = ProgressEmitter::new("_test_progress");
        progress_emitter.complete_work_units(5);

        assert_eq!(progress_emitter.overall_percentage(), 0.5);
        Ok(())
    }

    #[test]
    fn add_over_count() -> Result<()> {
        let mut progress_emitter = ProgressEmitter::new("_test_progress");
        progress_emitter.complete_work_units(25);

        assert_eq!(progress_emitter.overall_percentage(), 0.997);
        Ok(())
    }
}
