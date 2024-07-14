import { ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import { Job } from "../../types"
import { invokeGetActiveJobs, invokeStopJob } from "../../utils/invokes"

import "./index.css"
import { StopButton } from "./button"

type JobsStopButtonProps = {
  jobId?: string
  onStop?: (jobId: string) => void
  noJobsFallback?: () => ReactNode
}

export const JobsStopButton = ({
  jobId,
  onStop,
  noJobsFallback,
}: JobsStopButtonProps) => {
  const [jobs, setJobs] = useState<Job[]>([])

  const [stoppingJobId, setStoppingJobId] = useState<string | null>(null)

  useEffect(() => {
    const interval = setInterval(async () => {
      const jobs = await invokeGetActiveJobs()
      setJobs(jobs)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!onStop) return
    if (stoppingJobId && !jobs.map(({ id }) => id).includes(stoppingJobId)) {
      console.log("onStoP", onStop)
      onStop(stoppingJobId)
      setStoppingJobId(null)
    }
  }, [onStop, jobs, stoppingJobId])

  const stopJob = useCallback(async (jobId: string) => {
    await invokeStopJob(jobId)
    setStoppingJobId(jobId)
  }, [])

  const filteredJobs = useMemo(() => {
    if (!jobId) return jobs
    return jobs.filter(({ id }) => id.startsWith(jobId))
  }, [jobs, jobId])

  return (
    <div>
      {/* {JSON.stringify(filteredJobs)} */}
      {filteredJobs.map(({ id, status }) => (
        <StopButton key={id} onClick={() => stopJob(id)} status={status} />
      ))}
      {filteredJobs.length === 0 && noJobsFallback && noJobsFallback()}
    </div>
  )
}
