// Used Uqbar's pals interface for reference
// https://github.com/uqbar-dao/urbit/blob/escape/pkg/interface/src/logic/state/pals.ts

import Urbit from '@urbit/http-api'

declare global {
  interface Window {
    urbit: Urbit;
  }
}

export interface MutualPals {
  [key: string]: { lists: string[] };
}


class Pals extends EventTarget {
  urbit: Urbit;

  constructor(urbit = window.urbit) {
    super();
    console.log("constructing pals interface")
    this.urbit = urbit;
  }

  async getPals() {
    console.log("attempting to fetch pals")
    const pals = await this.urbit.scry<string>({app: 'pals', path: '/json'});
    console.log(pals);
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