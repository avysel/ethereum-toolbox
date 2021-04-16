# ethereum-reentrancy
Test pour comprendre la faille de sécurité "Ré-entrée" d'Ethereum.

## Environnement
- Truffle
- Web3.js 0.20.7
- Node.js

## Utilisation 
1. Deploy Dropbox.sol (using Truffle or Remix for example)

2. In reentrancy.js
- Change `dropboxContractAddress` with Dropbox contract address in your blockchain
- Change `nodeUrl` with your local blockchain node
- Change `contractAccount` with Dropbox contract owner address
- Change `userAccount` with a regular Dropbox user address (who will be stolen his ether)
- Change `attackerAccount` with attacker address

3. Run
`npm reentrancy.js`

## Fichiers
- Dropbox.sol : contrat permettant aux utilisateurs de venir y déposer des ethers, puis de venir les récupérer. Chacun ne peut récupérer que ce qu'il a déposé.
- DropboxThief.sol : contrat malveillant qui vient déposer des Ether dans Dropbox puis qui vient les récupérer ainsi que toutes les sommes déposées par les autres utilisiateurs.
- DopboxSafe.sol : contrat implémentant une Dropbox sécurisée qui résiste au contrat malveillant.
- reentrancy.js : le déroulement d'un utilisateur qui ajoute des Ethers, puis l'attaquant qui déploie son contrat et récupère tous les Ethers.
- dropbox.js : l'utilisation de la Dropbox sans attaque

### Autres fichiers
- /build/ : les ABI
- dropboxthief-bytecode.json : le bytecode du contrat malveillant pour le déploiement dynamique


## Comment cela se produit-il ?
- Chaque contrat devant reçevoir des Ethers doit implémenter une fonction fallback qui est appelée automatiquement à chaque réception d'Ether.
- La Dropbox retourne les Ethers à leur propriétaire via "msg.sender.call.value", qui ne consomme pas de gaz et donc peut être exécutée à l'infini.
- La Dropbox effectue le remboursement avant de mettre à zéro la balance de l'utiisateur.

En partant de ces 3 constats, le contrat malveillant fait une demande de récupération des Ethers et implémente une nouvelle demande dans sa fonction de fallback.

En conséquence, Dropbox lui renvoie ses Ethers, puis le fallback malveillant est appelé et effectue une nouvelle demande de récupération. A ce niveau, la balance n'a pas encore été remise à zéro, donc Dropbox considère que l'utilisateur peut toujours récupérer ses Ethers et lui envoie à nouveau. Le fallback est alors à nouveau appelé, etc ...

Cette succession d'appels va alors siphonner tout ce que la Dropbox possède et s'arrêtera lorsque sa balance sera à zéro.

## Comment le contrer ?

Il existe plusieurs possibilités pour corriger cette faille :

- Effectuer une remise à zéro de la balance de l'utilisateur dans la Dropbox avant d'envoyer les Ethers.
- Implémenter une Mutex dans la fonction de récupération afin qu'elle ne puisse pas être appelée plusieurs fois par la même adresse.
- Envoyer les Ether au moyen de send() ou transfer(), qui consomment du gaz. La limite de gaz de la transaction initiale de récupération sera donc atteinte plus rapidement et la transaction sera rejetée, les Ethers ne seront pas transférés.
