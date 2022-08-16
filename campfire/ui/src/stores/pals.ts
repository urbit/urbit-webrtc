import Urbit from "@urbit/http-api";
import { action, makeAutoObservable, runInAction } from "mobx";
import Pals from 'pals'

export class PalsStore {
    urbit: Urbit | null;
    palsInterface: Pals;
    mutuals: string[];
    justIncoming: string[];
    justOutgoing: string[];

    constructor() {
        this.urbit = new Urbit("", "");
        // requires <script> tag for /~landscape/js/session.js
        this.urbit.ship = (window as any).ship;
        this.urbit.verbose = true;
        this.palsInterface = new Pals(this.urbit);
        this.loadPals();
        makeAutoObservable(this);
    }

    @action.bound
    async loadPals() {
        const p = await this.palsInterface.getPals();
        if (this.urbit.verbose) {
            console.log("palsStore loaded these pals", p);
        }
        const incoming = p["incoming"];
        const outgoing = p["outgoing"];
        const mutuals = Object.keys(outgoing).filter(k => k in incoming)
        // get just outgoing pals (ie not mutuals)
        const outgoingPals = Object.keys(outgoing).filter(k => (k in incoming) === false);
        // get just incoming pals (ie not mutuals)
        const incomingPals = Object.keys(incoming).filter(k => (k in outgoing) === false);
        runInAction(() => {
            this.mutuals = mutuals;
            this.justIncoming = incomingPals;
            this.justOutgoing = outgoingPals;
        })
    }


}
