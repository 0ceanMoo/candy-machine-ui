import * as anchor from '@project-serum/anchor';
import { MintCountdown } from './MintCountdown';
import { toDate, formatNumber } from './utils';
import {
  CandyMachineAccount,
} from './candy-machine';

export function Remaining({itemsRemaining}: {itemsRemaining: any}) {
  return (
    <>
      <dt>Remaining</dt>
      <dd>{itemsRemaining}</dd>
    </>
  )
}

export function Price({isWhitelistUser, discountPrice, candyMachine}: {isWhitelistUser: any, discountPrice: any, candyMachine: any}) {
  return (
    <>
      <dt>{isWhitelistUser && discountPrice ? 'Discount Price' : 'Price'}</dt>
      <dd>{isWhitelistUser && discountPrice ? formatNumber.asNumber(discountPrice) : formatNumber.asNumber(candyMachine.state.price,)}</dd>
    </>
  )
}

export function Status({isActive, endDate, candyMachine, toggleMintButton, isPresale}: {isActive: any, endDate: any, candyMachine: any, toggleMintButton: any, isPresale: any}) {
  return (
    <>
      {isActive && endDate && Date.now() < endDate.getTime() ? (
        <>
          <dt>Status</dt>
          <MintCountdown
            key="endSettings"
            date={getCountdownDate(candyMachine)}
            style={{ justifyContent: 'flex-end' }}
            status="COMPLETED"
            onComplete={toggleMintButton}
          />
          <dd>TO END OF MINT</dd>
        </>
      ) : (
        <>
          <dt>Status</dt>
          <MintCountdown
            key="goLive"
            date={getCountdownDate(candyMachine)}
            style={{ justifyContent: 'flex-end' }}
            status={
              candyMachine?.state?.isSoldOut || (endDate && Date.now() > endDate.getTime()) ? 'COMPLETED' : isPresale ? 'PRESALE' : 'LIVE'
            }
            onComplete={toggleMintButton}
          />
          {
            isPresale
            && candyMachine.state.goLiveDate
            && candyMachine.state.goLiveDate.toNumber() > new Date().getTime() / 1000
            && (<dd> UNTIL PUBLIC MINT</dd>)
          }
      </>
      )}
    </>
  )
}

const getCountdownDate = (
  candyMachine: CandyMachineAccount,
): Date | undefined => {
  if (
    candyMachine.state.isActive &&
    candyMachine.state.endSettings?.endSettingType.date
  ) {
    return toDate(candyMachine.state.endSettings.number);
  }

  return toDate(
    candyMachine.state.goLiveDate
      ? candyMachine.state.goLiveDate
      : candyMachine.state.isPresale
      ? new anchor.BN(new Date().getTime() / 1000)
      : undefined,
  );
};
