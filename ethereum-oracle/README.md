# ethereum-oracle
Exemple pour comprendre le fonctionnement d'un oracle pour Ethereum

## Fonctionnement

D'un côté, une API qui fournit les données qui provoqueront des appels aux smart contracts.


L'oracle interroge l'API à interval régulier pour récupérer une valeur. Si la valeur récupérée est différente de la dernière valeur lue, l'oracle va envoyer une transaction au smart contract pour mettre à jour la valeur.

Le smart contract possède un événement qui est émis à chaque appel de sa méthode de misa à jour de valeur. Cette événement contient une donnée : la nouvelle valeur fournie.

Le consommateur, de son côté, écoute l'événement du smart contract. A chaque nouvelle mise à jour, il sera donc sollicité et affichera la nouvelle valeur récupérée.


## Fichiers

### Points d'entrée
- api.js : API qui se connecte à un noeud Ethereum et retourne le numéro du dernier bloc. Peut être modifié ou remplacé par n'importe quel service qui retourne une donnée changeant régulièrement de valeur.
- index.js : lance l'oracle et le consommateur

### Détail
- contracts/ValueOracle.sol : le code du smart contract
- oracle.js : le code de l'oracle
- consumer.js : le destinaire de l'action de l'oracle
- ethereum.js : le code permettant à l'oracle et au consommateur d'interagir avec le contrat
- config.js : fichier de configuration


### Autres fichiers
- /build/ : les ABI


## Tester
1) Dans un terminal, lancer l'API.
```
node api.js
```

2) Déployer **ValueOracle.sol**

3) Mettre à jour **config.js**
- Adresse du contrat : *config.contractAddress="Ox...";*
- URL de la blockchain : *config.nodeURL = "http://127.0.0.1";*
- Port de la blockchain : *config.nodePort = 7545;*
- Adresse du compte émetteur des transaction de l'oracle : *config.account = "0x...";*
- ABI du contrat : *config.abiFile = "./build/contracts/ValueOracle.json";*

4) Dans un autre terminal, lancer l'oracle et le consommateur.
```
node index.js
```

## Généralisation
La mise en place d'un oracle peut se généraliser de la façon suivante :

Un oracle se compose de :
- un smart contract qui effectue une action particulière lors d'un événement 
- un service qui appele une fonction du smart contract pour déclencher l'événement. Il peut être par exemple un service qui consulte une source de donnée et appelle le contrat en fonction du résultat, une action déclenchée par un utilisateur (clic ...)
- un consommateur qui récupère le résultat de l'action du smart contract. Ca peut être un service qui écoute un événement du contrat ou un autre contrat appelé par le contrat de l'oracle. Il peut même ne pas y avoir de consommateur si l'action effectuée par le contrat se suffit à elle-même (exemple : simple transfert d'Ether sans action supplémentaire).
