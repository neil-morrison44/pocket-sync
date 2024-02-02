use log::error;
use log::logger;

pub trait ResultLogger<T, E> {
    fn unwrap_and_log(self) -> T
    where
        E: std::fmt::Debug;
}

impl<T, E> ResultLogger<T, E> for Result<T, E> {
    #[track_caller]
    fn unwrap_and_log(self) -> T
    where
        E: std::fmt::Debug,
    {
        match self {
            Ok(t) => t,
            Err(e) => {
                let caller = core::panic::Location::caller();
                error!("called `Result::unwrap_or_log()` on an `Err` value: {e:?}, {caller}");
                logger().flush();
                panic!("called `Result::unwrap_or_log()` on an `Err` value: {e:?}");
            }
        }
    }
}

pub trait OptionLogger<T> {
    fn unwrap_and_log(self) -> T;
}

impl<T> OptionLogger<T> for Option<T> {
    #[track_caller]
    fn unwrap_and_log(self) -> T {
        match self {
            Some(t) => t,
            None => {
                let caller = core::panic::Location::caller();
                error!("called `Option::unwrap_or_log()` on an `None` value, {caller}");
                panic!("called `Option::unwrap_or_log()` on an `Err` value");
            }
        }
    }
}
