# OuRPS - Our Rock Paper Scissors

Smart contract for collectively playing rock paper scissors game.

Remarks: 
* Every round lasts 10 minutes.
* Every vote takes a maintenance fee (1 gwei) for finalizing rounds.
* Finalizing rounds requires an external party to call `endRound` method.
* All maintenance fee gathered in a round is transferred to result processor of that round.
