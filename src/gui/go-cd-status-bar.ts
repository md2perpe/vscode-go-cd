import { PipelineHistory } from '../api/models/pipeline-history.model'
import * as vscode from 'vscode'
import { State } from '../state'
import { map, filter } from 'rxjs/operators'
import { Pipeline } from '../api/models/pipeline.model'
import { PipelineGroup } from '../api/models/pipeline-group.model'
import { getIconFromPipelineInstance } from './tree/utils'
import { Icons } from './icons'
import { PipelineInstance } from '../api/models/pipeline-instance.model'

export class GoCdStatusBar {
  statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    0
  )

  constructor() {}

  init() {
    State.selectedPipeline$
      .pipe(
        filter(pipeline => !!pipeline),
        map(pipeline => pipeline && pipeline)
      )
      .subscribe(
        pipeline => this.resetStatus(pipeline),
        err => console.error(err)
      )
  }

  getIconStringFromPipeline(instance: PipelineInstance) {
    return (
      instance._embedded.stages
        .map(stage => stage.status)
        .map((status, idx, arr) => {
          switch (status) {
            case 'Failed':
              return '$(issue-opened)'
            case 'Passed':
              return '$(check)'
            case 'Building':
              return '$(sync)'
            case 'Cancelled':
              return '$(circle-slash)'
          }
        })
        .filter(x => !!x)
        .pop() || ''
    )
  }

  resetStatus(pipeline?: Pipeline) {
    if (pipeline) {
      const lastInstance = pipeline._embedded.instances.pop()
      this.statusBar.text = lastInstance
        ? this.getIconStringFromPipeline(lastInstance)
        : ''
      if (pipeline.pause_info.paused) {
        this.statusBar.text = `$(clock) ${pipeline.name} - Paused`
      } else {
        this.statusBar.text += ` ${pipeline.name} ${lastInstance && lastInstance.label}`
      }
      this.statusBar.show()
    }
  }

  refresh() {
    State.forceRefresh$.next()
  }
}
