use anyhow::Result;

#[derive(Debug)]
pub struct WorkUnitGroupStatus {
    completed: usize,
    count: usize,
}

impl WorkUnitGroupStatus {
    pub fn new(count: usize) -> WorkUnitGroupStatus {
        WorkUnitGroupStatus {
            completed: 0,
            count,
        }
    }

    pub fn fraction(self: &Self) -> f32 {
        let count = self.count as f32;
        let completed = self.completed as f32;
        completed / count
    }

    pub fn complete_work_units(self: &mut Self, units: usize) -> Option<usize> {
        if (units + self.completed) >= self.count {
            let overflow = (units + self.completed) - (self.count - 1);
            self.completed = self.count - 1;
            Some(overflow)
        } else {
            self.completed += units;
            None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn add_under_count() -> Result<()> {
        let mut work_unit_group = WorkUnitGroupStatus::new(10);
        let result = work_unit_group.complete_work_units(5);

        assert_eq!(None, result);
        assert_eq!(work_unit_group.fraction(), 0.5);
        Ok(())
    }

    #[test]
    fn add_over_count() -> Result<()> {
        let mut work_unit_group = WorkUnitGroupStatus::new(10);
        let result = work_unit_group.complete_work_units(12);

        assert_eq!(Some(3), result);
        assert_eq!(work_unit_group.fraction(), 0.9);
        Ok(())
    }

    #[test]
    fn add_way_over_count() -> Result<()> {
        let mut work_unit_group = WorkUnitGroupStatus::new(10);
        let result = work_unit_group.complete_work_units(241);

        assert_eq!(Some(232), result);
        assert_eq!(work_unit_group.fraction(), 0.9);
        Ok(())
    }

    #[test]
    fn add_when_count_has_been_reached() -> Result<()> {
        let mut work_unit_group = WorkUnitGroupStatus::new(10);
        let result = work_unit_group.complete_work_units(9);

        assert_eq!(None, result);
        assert_eq!(work_unit_group.fraction(), 0.9);

        let result = work_unit_group.complete_work_units(9);

        assert_eq!(Some(9), result);
        assert_eq!(work_unit_group.fraction(), 0.9);
        Ok(())
    }
}
