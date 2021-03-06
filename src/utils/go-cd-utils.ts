import { Icons } from '../gui/icons'
import { Stage } from '../gocd-api/models/stage-history.model'
import { Result } from '../gocd-api/models/result.model'
import { Job, JobState } from '../gocd-api/models/job.model'
import { PipelineHistory } from '../gocd-api/models/pipeline-history.model'
import { PipelineInstance } from '../gocd-api/models/pipeline-instance.model'
import { Pipeline } from '../gocd-api/models/pipeline.model'

export function getIconFromResult(result: Result) {
  switch (result) {
    case 'Failed':
      return Icons.issueOpened
    case 'Passed':
      return Icons.check
    case 'Cancelled':
      return Icons.circleSlash
    case 'Unknown':
    default:
      return undefined
  }
}

export function getIconFromJobState(state: JobState) {
  switch (state) {
    case 'Building':
      return Icons.sync
    case 'Scheduled':
      return Icons.clock
  }
}

export function getIconFromJob(job: Job) {
  return getIconFromResult(job.result) || getIconFromJobState(job.state)
}

export function getIconFromStage(stage: Stage) {
  switch (stage.result) {
    case 'Failed':
      return Icons.issueOpened
    case 'Passed':
      return Icons.check
    case 'Cancelled':
      return Icons.circleSlash
    case 'Unknown':
      const x = stage.jobs.map(
        job => (job.result === 'Unknown' ? job.state : job.result)
      )
      if (
        x.every(
          state =>
            state === 'Building' || state === 'Scheduled' || state === 'Passed'
        )
      ) {
        return Icons.sync
      } else if (x.some(state => state === 'Failed')) {
        return Icons.issueReopened
      }
  }
}

export function getIconFromPipelineInstance(instance: PipelineInstance) {
  return instance._embedded.stages
    .map(stage => stage.status)
    .map((status, idx, arr) => {
      switch (status) {
        case 'Failed':
          return Icons.issueOpened
        case 'Passed':
          return Icons.check
        case 'Building':
          return Icons.sync
        case 'Cancelled':
          return Icons.circleSlash
      }
    })
    .filter(x => !!x)
    .pop()
}

export function getIconFromHistory(history: PipelineHistory) {
  return history.stages.map(getIconFromStage).pop()
}

export function getLatestPipelineInstance(pipeline: Pipeline) {
  return pipeline._embedded.instances.slice(-1).pop()
}
