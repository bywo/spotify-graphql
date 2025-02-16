import { isUndefined } from "lodash";

let pollsMap: { [k: string]: Poll } = {};

export interface ITaskWrapper {
  task: () => Promise<any>;
  resolver: Function;
  rejecter: Function;
}

export class Poll {
  public queue: ITaskWrapper[] = [];
  public poll: any = null;

  constructor(
    private name: string,
    private delay: number = 200,
    private debug: boolean = false
  ) {}

  public async run(): Promise<void> {
    this.log("add item to queue", this.queue.length);
    if (!this.isRunning() && !this.isEmpty()) {
      this.poll = true;
      let isFirst = true;

      while (!this.isEmpty()) {
        if (!isFirst) {
          await new Promise(resolve => setTimeout(resolve, this.delay));
        }

        this.log("consume from queue", this.queue.length);
        let taskWrapper: ITaskWrapper = this.queue.pop();
        await taskWrapper.task
          .call(taskWrapper)
          .then(taskWrapper.resolver, taskWrapper.rejecter);

        isFirst = false;
      }

      this.poll = null;
    }
  }

  public addToQueue(task: () => Promise<any>): Promise<any> {
    let taskWrapper: ITaskWrapper = {
      task: task,
      resolver: null,
      rejecter: null
    };
    this.queue.push(taskWrapper);
    // tslint:disable-next-line:promise-must-complete
    let promiseSync: Promise<any> = new Promise((resolve, reject) => {
      taskWrapper.resolver = resolve;
      taskWrapper.rejecter = reject;
    });
    this.run();
    return promiseSync;
  }
  public isRunning(): boolean {
    return this.poll !== null;
  }
  public isEmpty(): boolean {
    return this.queue.length === 0;
  }

  private log(...args): void {
    if (this.debug) {
      console.log.apply(console.log, ["Poll >"].concat(args));
    }
  }
}

// Given a namespace, synchronize all tasks polling to avoid DoS Spotify API
export function syncedPoll(
  namespace: string,
  task: () => Promise<any>,
  delay: number = 200
): Promise<any> {
  if (isUndefined(pollsMap[namespace])) {
    pollsMap[namespace] = new Poll(namespace, delay);
  }
  return pollsMap[namespace].addToQueue(task);
}
