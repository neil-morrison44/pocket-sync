pub struct ProgressEmitter<'a> {
    window: &'a tauri::Window,
    count: usize,
    current: usize,
}

impl ProgressEmitter<'_> {
    pub fn start(count: usize, window: &tauri::Window) -> ProgressEmitter {
        window
            .emit(
                "progress-start-event",
                ProgressStartPayload { progress: 0.0 },
            )
            .unwrap();

        ProgressEmitter {
            count: count,
            current: 0,
            window: window,
        }
    }

    pub fn emit_progress(&mut self, msg: &str) -> () {
        self.current = self.current + 1;
        self.window
            .emit(
                "progress-event",
                ProgressPayload {
                    message: String::from(msg),
                    progress: self.percent(),
                },
            )
            .unwrap();
    }

    pub fn end(&self) -> () {
        self.window
            .emit("progress-end-event", ProgressEndPayload {})
            .unwrap();
    }

    fn percent(&self) -> f32 {
        (((self.current as f32) / (self.count as f32)) * 100.0) as f32
    }
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct ProgressStartPayload {
    progress: f32,
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct ProgressPayload {
    message: String,
    progress: f32,
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct ProgressEndPayload {}
