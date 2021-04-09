# Créer un NFT sur Ethereum

Les NFT (Non Fongible Token, tokens non fongibles) sont des tokens uniques, non remplaçables par d'autres.

Sur Ethereum, on trouve 2 standards de NFT : 
- [ERC-721](http://erc721.org/), qui permet de décrire un **token unique**, où le smart contract doit être instancié pour chaque nouvelle occurrence.
- ERC-1155, qui permet gérer nativement un **token créé en quantité**.


**Un NFT est avant tout un smart contract** qui :
- contient toutes les données spécifique à l'objet qu'il représente
- implémente les fonctionnalités standard (ERC-721 ou ERC-1155) qui vont définir les règles de possession et de transfert.

Les interactions avec un NFT vont se faire au moyen de transactions, comme pour n'importe quelle activation de smart contract.

## Fonctionnement général

Un smart contract ERC-271 va permettre de gérer un ensemble de tokens de même type (les différents éléments d'une même collection, par exemple). Il va contenir une liste de tous les tokens créés, leurs propriétaires ainsi que les personnes ayant le droit d'agir sur ces tokens.

### Opérateur et approbation

Le propriétaire d'un token a les pleins pouvoir sur lui. Mais il peut aussi déléguer son droit à des **opérateurs**.

La norme ERC-271 permet de définir cette délégation de deux façons différentes : via une **adresse approuvée**, propre à un token et qui peut agir au nom du propriétaire pour le token en question, ou via un **opérateur approuvé**, par lequel le propriétaire délègue son droit à un opérateur identifié pour l'ensemble de ses tokens (gérés par le contrat).

Cette délégation permet notamment à une marketplace de gérer les échanges de NFT entre propriétaires et acheteurs.

### ERC-165

Afin de transférer un NFT à une autre utilisateur, aucun problème particulier ne se pose. Il le recevra dans son wallet et pourra le gérer à sa guise. 

Mais si l'on souhaite le transférer à un autre contrat, il faut être certain que ce contrat destinataire puisse ensuite le gérer. Sinon cela reviendrait à brûler le token, il serait perdu à jamais.

ERC-271 va alors s'appuyer sur la norme [ERC-165](https://eips.ethereum.org/EIPS/eip-165). Elle permet à un contrat de savoir si un autre contrat implémente bien telle interface. Tout contrat destiné à recevoir des NFT doit également l'implémenter afin de répondre favorablement à une vérification de capacité envoyée par l'émetteur.

Attention, cette norme ne va pas garantir que tout se passera bien. Elle va simplement garantir que le créateur du contrat destinataire annonce qu'il a pris les mesures nécessaires pour que tout se passe bien. La nuance mérite d'être signalée.

## Sous le capot d’ERC-721

Jetons un oeil aux fonctionnalités imposées par la norme ERC-721.

### Interface du smart contract

Voici l'interface qu'un smart contract doit implémenter pour être compatible ERC-721.

```
pragma solidity ^0.8.0;

interface ERC721 {
    event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);
    event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);
    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);
    function balanceOf(address _owner) external view returns (uint256);
    function ownerOf(uint256 _tokenId) external view returns (address);
    function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes calldata data) external payable;
    function safeTransferFrom(address _from, address _to, uint256 _tokenId) external payable;
    function transferFrom(address _from, address _to, uint256 _tokenId) external payable;
    function approve(address _approved, uint256 _tokenId) external payable;
    function setApprovalForAll(address _operator, bool _approved) external;
    function getApproved(uint256 _tokenId) external view returns (address);
    function isApprovedForAll(address _owner, address _operator) external view returns (bool);
}
```

Regardons ça en détail :

```
function balanceOf(address _owner) external view returns (uint256);
```
`balanceOf` permet de connaître le nombre de NFT possédés par un utilisateur dont l'adresse est passée en paramètre.

```
function ownerOf(uint256 _tokenId) external view returns (address);
```
`ownerOf` permet de connaitre l'adresse du propriétaire d'un token dont l'id est passée en paramètre.

```
function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes calldata data) external payable;
function safeTransferFrom(address _from, address _to, uint256 _tokenId) external payable;
```

`safeTransfeFrom` effectue un transfert de propriété d'un token depuis un adresse vers une autre. Facultativement, des données libres peuvent être fournies. Cette fonction doit vérifier que le destinataire est techniquement capable de recevoir le token.

```
function transferFrom(address _from, address _to, uint256 _tokenId) external payable;
```
`transferFrom` est identique à `safeTransferFrom` à l'exception de la vérification de capacité à recevoir le token par le destinataire qui n'est pas effectuée.

Il est évident que l'utilisation de `safeTransferFrom` doit être privilégiée à celle de `transferFrom`.

L'événement `Transfer` doit être émis lors de l'appel aux 3 fonctions ci-dessus, afin de tracer l'historique des transferts.

```
function approve(address _approved, uint256 _tokenId) external payable;
```
`approve` accorde le droit à un utilisateur autre que le propriétaire du token de transférer celui-ci. Ce droit doit être supprimé lors d'un transfer.
L'événement `Approval` doit être émis pour historiser l'opération.

```
function getApproved(uint256 _tokenId) external view returns (address);
```
`getApproved` permet de connaître l'adresse de l'utilisateur, autre que le propriétaire du token, qui est autorisée à le transférer.



```
function setApprovalForAll(address _operator, bool _approved) external;
```

Avec `setApproval`, un propriétaire de token accorde le doit à un utilisateur de transférer tous ses tokens.
L'événement `ApprovalForAll` doit être émis pour historiser l'opération.


```
function isApprovedForAll(address _owner, address _operator) external view returns (bool);
```
`isApprovedForAll` permet de savoir si un utilisateur a été autorisé par un propriétaire de token à transférer tous les tokens qu'il possède.


## Fonctionnement

Un smart contract qui veut définir un NFT doit donc implémenter ces fonctions. Il faut également appliquer un certain nombre de règles :
- vérifier que les `tokenId` utilisés existent bien
- vérifier que seul de propriétaire du token peut accorder les droits à une autre personne
- vérifier que seuls le propriétaire ou un utilisateur autorisé peuvent transférer un token

## Exemple

Nous allons mettre en place un token ERC-271 très simple afin de comprendre le mécanisme. Nous n'allons pas gérer une collection entière, mais un token unique. Nous pouvons presque dire que le contrat sera le token lui-même.

Notre contrat ne va donc pas utiliser de moyen d'identifier un token, via son `tokenId`, mais cette notion sera tout de même présente dans les signatures de fonctions afin de respecter le standard.
