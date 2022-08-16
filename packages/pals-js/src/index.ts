// Used Uqbar's pals interface for reference
// https://github.com/uqbar-dao/urbit/blob/escape/pkg/interface/src/logic/state/pals.ts

import Urbit from '@urbit/http-api'

declare global {
  interface Window {
    urbit: Urbit;
  }
}

class Pals extends EventTarget {
  urbit: Urbit;

  constructor(urbit = window.urbit) {
    super();
    this.urbit = urbit;
  }

  async getPals(): Promise<string> {
    const pals = await this.urbit.scry<string>({ app: 'pals', path: '/json' });
    if (this.urbit.verbose) {
      console.log("Just fetched pals list: ", pals)
    }
    return pals;
  }

  addPal(ship: string, tags: string[] = []) {
    this.urbit.poke({
      app: 'pals',
      mark: 'pals-command',
      json: {
        meet: { ship, in: tags }
      }
    })
  }

  removePal(ship: string) {
    this.urbit.poke({
      app: 'pals',
      mark: 'pals-command',
      json: {
        part: { ship, in: [] }
      }
    })
  }
}

export default Pals;