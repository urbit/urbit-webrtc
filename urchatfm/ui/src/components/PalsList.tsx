import { deSig } from '@urbit/api';
import useUrchatStore from '../useUrchatStore';
import React, { useEffect, useState } from 'react';
import { sigil, reactRenderer } from '@tlon/sigil-js'
import { CallFriend } from '../icons/CallFriend';
import { Camera } from '../icons/Camera';


interface PalsProps {
  ship: string;
  placeCall: (ship: string) => void;
}

// const Sigil = props => {
//   return (
//     <>{
//       sigil({
//         patp: props.patp,
//         renderer: reactRenderer,
//         size: 40,
//         colors: ['black', 'white'],
//       })
//     }</>
//   )
// }


const PalCaller = ({ placeCall, ship }: PalsProps) => {
  const initiatePalCall = () => {
    placeCall(ship);
  }
  return (
    <>
      <div className="flex flex-row w-full mt-3 h-10 bg-blue-100 rounded-lg">
        {/* <Sigil patp={ship} /> */}
        <h1 className="text-xl font-semibold w-1/2 text-center font-mono my-auto">{ship}</h1>
        <button className="h-5/6 flex flex-row my-auto flex-1" type="submit" onClick={initiatePalCall}>
          <p className="my-auto">Call Them</p>
          <CallFriend className="h-full mx-1" secondary="text-pink-900 bg-pink-500 fill-current"/>
        </button>
      </div>
    </>
  );
}


interface PalsListProps {
  placeCall: (ship: string) => void;
}

export const PalsList = ({ placeCall }: PalsListProps) => {

  const { startPals, pals } = useUrchatStore();
  const [palsList, setPals] = useState<string[]>(["~bus", "~zod"]);

  const onSubmitCall = (ship: string) => {
    placeCall(deSig(ship));
  }

  useEffect(() => {
    startPals();
  }, []);

  const test = async () => {
    const listOfPals = await pals.getPals();
    const incoming = listOfPals["incoming"];
    const outgoing = listOfPals["outgoing"];
    const mutuals = Object.keys(outgoing).filter(k => k in incoming)
    setPals(mutuals);
  }


  return (
    <>
      <div className="w-full p-2">
        <div className='flex flex-row'>
        <h1 className="text-3xl font-semibold font-mono">%pals</h1>
        <button type="submit" onClick={test} className="button bg-blue-200 flex-1">Refresh mutuals list</button>
        </div>
        {
          palsList.map((shipName) => {
            return <PalCaller key={shipName} ship={shipName} placeCall={onSubmitCall} />
          })
        }
      </div>
    </>
  );
}