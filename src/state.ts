import {
  merge,
  interval,
  Subject,
  from,
  of,
  asapScheduler,
  Observable
} from 'rxjs'
import {
  map,
  switchMap,
  mapTo,
  skipWhile,
  publishReplay,
  tap,
  withLatestFrom,
  catchError,
  exhaustMap,
  observeOn,
  share,
  filter,
  flatMap
} from 'rxjs/operators'
import { Configuration } from './configuration'
import { GoCdApi } from './gocd-api'
import {
  PipelineHistory,
  PaginatedPipelineHistory
} from './gocd-api/models/pipeline-history.model'

export namespace State {
  export let paused: boolean = false

  export const forceRefresh$ = new Subject<void>()

  const configuration$ = Configuration.all$.pipe(
    skipWhile(config => !config.url),
    switchMap(config =>
      merge(
        of(null),
        forceRefresh$.pipe(tap(() => console.log('Forced Refresh'))),
        interval(Math.max(config.refreshInterval, 5000)).pipe(
          tap(() => console.log('Regular Refresh'))
        )
      ).pipe(mapTo(config))
    ),
    skipWhile(() => paused),
    tap(() => console.log('out!'))
  )

  export const pipelineGroups$ = configuration$.pipe(
    exhaustMap(({ url, username, password }) =>
      GoCdApi.getPipelineGroups(url, username, password)
    ),
    share()
  )

  export const pipelines$ = pipelineGroups$.pipe(
    map(
      pipelineGroups =>
        pipelineGroups &&
        pipelineGroups
          .map(pipeline => pipeline._embedded.pipelines)
          .reduce((previousValue = [], currentPipelines) =>
            previousValue.concat(currentPipelines)
          )
    ),
    share()
  )

  export const selectedPipeline$ = pipelines$.pipe(
    withLatestFrom(configuration$),
    filter(([pipelines$, config]) => !!config.pipeline),
    map(([pipelines, config]) =>
      pipelines.find(pipeline => pipeline.name === config.pipeline)
    ),
    share()
  )

  export function getPipeline$(name: string) {
    return pipelines$.pipe(
      map(pipelines => pipelines.find(pipeline => pipeline.name === name)),
      publishReplay(1)
    )
  }
}
