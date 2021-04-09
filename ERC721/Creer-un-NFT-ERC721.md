# Mon premier NFT sur Ethereum avec ERC-271

Les NFT (Non Fungible Token, tokens non fongibles) sont des tokens uniques, non remplaçables par d'autres.

Sur Ethereum, on trouve plusieurs standards de tokens. Les plus connus sont :
- [ERC-20](https://eips.ethereum.org/EIPS/eip-20) qui permet de mettre en place un token fongible, base de toutes les cryptomonnaies bâties sur Ethereum.
- [ERC-721](http://erc721.org/), qui permet de décrire un token non fongible mais limite les transferts à un token à la fois par transaction.
- [ERC-1155](https://eips.ethereum.org/EIPS/eip-1155), qui permet gérer simultanément des tokens fongibles, non fongibles, semi-fongibles et permet des transferts multiples en une seule transaction

Le standard ERC-721 est le plus utilisé pour les NFT.


Attention, dans le langage courant, **le token** peut désigner soit la définition du smart contract ERC-721 (ex: [le token CryptoKitties](https://etherscan.io/token/0x06012c8cf97bead5deae237070f9587f8e7a266d?a=2281#readContract), qui représente la collection des chats virtuels sur Ethereum), soit un actif précis issu de cette définition (ex: [le CryptoKitties numéro 10](https://etherscan.io/token/0x06012c8cf97bead5deae237070f9587f8e7a266d?a=10#inventory) qui est un chat roux avec des tâches roses appartenant à l'adresse 0x88207b431...). Il faut bien avoir cette distinction en tête pour ne pas se perdre dans certaines explications.

## Fonctionnement général

Un smart contract ERC-721 va permettre de gérer un ensemble de tokens de même type (les différents éléments d'une même collection, par exemple). Il va contenir une liste de tous les tokens créés, leurs propriétaires ainsi que les personnes ayant le droit d'agir sur ces tokens.

**Un NFT est avant tout un smart contract** qui :
- contient toutes les données spécifique à l'objet qu'il représente
- implémente les fonctionnalités du standard qui vont définir les règles de possession et de transfert.

Les interactions avec un NFT vont se faire au moyen de transactions, comme pour n'importe quelle activation de smart contract.

### Opérateur et approbation

Le propriétaire d'un token a les pleins pouvoir sur lui. Mais il peut aussi déléguer son droit à des **opérateurs**.

La norme ERC-721 permet de définir cette délégation de deux façons différentes : via une **adresse approuvée**, propre à un token et qui peut agir au nom du propriétaire pour le token en question, ou via un **opérateur approuvé**, par lequel le propriétaire délègue son droit à un opérateur identifié pour l'ensemble de ses tokens (gérés par le contrat).

Cette délégation permet notamment à une marketplace de gérer les échanges de NFT entre propriétaires et acheteurs.

### ERC721Metadata

Un token ERC-721 peut implémenter l'interface `ERC721Metadata` qui va contenir ses données spécifiques : le nom et le symbole du token, comme n'importe quel cryptomonnaie, et un URI qui renvoie vers la ressource identifiée hors blockchain. Cela peut être un fichier JSON par exemple, qui contient la description du token.

Le token doit implémenter [ERC-165](https://eips.ethereum.org/EIPS/eip-165) qui lui permet d'indiquer qu'il supporte telle ou telle interface. Très utile pour savoir si on peut y trouver des `ERC721Metadata` par exemple !


### ERC721TokenReceiver

Afin de transférer un NFT à une autre utilisateur, aucun problème particulier ne se pose. Il le recevra dans son wallet et pourra le gérer à sa guise. 

Mais si l'on souhaite le transférer à un autre contrat, il faut être certain que ce contrat destinataire puisse ensuite le gérer. Sinon cela reviendrait à brûler le token, il serait perdu à jamais.

ERC-721 va alors s'appuyer sur l'interface `ERC721TokenReceiver`. Elle permet à un contrat de savoir si un autre contrat implémente bien telle interface. Tout contrat destiné à recevoir des NFT doit également l'implémenter afin de répondre favorablement à une vérification de capacité envoyée par l'émetteur.

Attention, cette norme ne va pas garantir que tout se passera bien. Elle va simplement garantir que le créateur du contrat destinataire annonce qu'il a pris les mesures nécessaires pour que tout se passe bien. La nuance mérite d'être signalée.

## Sous le capot d’ERC-721

### Interface du smart contract

Voici l'interface (ou plutôt les interfaces) qu'un smart contract doit implémenter pour être compatible ERC-721.

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

interface ERC721Metadata {
    function name() external view returns (string _name);
    function symbol() external view returns (string _symbol);
    function tokenURI(uint256 _tokenId) external view returns (string);
}

interface ERC165 {
    function supportsInterface(bytes4 interfaceID) external view returns (bool);
}

interface ERC721TokenReceiver {
    function onERC721Received(address _operator, address _from, uint256 _tokenId, bytes _data) external returns(bytes4);
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

`safeTransfeFrom` effectue un transfert de propriété d'un token depuis un adresse vers une autre. Facultativement, des données libres peuvent être fournies. Cette fonction doit vérifier que le destinataire est techniquement capable de recevoir le token selon la norme ERC-165.

```
function transferFrom(address _from, address _to, uint256 _tokenId) external payable;
```
`transferFrom` est identique à `safeTransferFrom` à l'exception de la vérification de capacité à recevoir le token par le destinataire qui n'est pas effectuée.


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

```
interface ERC721Metadata {
    function name() external view returns (string _name);
    function symbol() external view returns (string _symbol);
    function tokenURI(uint256 _tokenId) external view returns (string);
}
interface ERC165 {
    function supportsInterface(bytes4 interfaceID) external view returns (bool);
}

```
`ERC721Metadata` et `ERC-165`, à implémenter pour gérer les données spécifiques et la détection de leur présence. L'interfaceId est obtenu par `IERC721Receiver(contractAddress).onERC721Received.selector`. Le contrat retourne `true` s'il l'implémente.

```
interface ERC721TokenReceiver {
    function onERC721Received(address _operator, address _from, uint256 _tokenId, bytes _data) external returns(bytes4);
}
```
`ERC721TokenReceiver` que doit implémenter tout destinataire ou gestionnaire de NFT. La fonction `onERC721Received` doit retourner les 4 premiers octets du hachage de la signature de la fonction elle-même : `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`


### Fonctionnement

Un smart contract qui veut définir un NFT doit donc implémenter ces fonctions. Il faut également appliquer un certain nombre de règles :
- les `tokenId` utilisés existent bien
- seul de propriétaire du token peut accorder les droits à une autre personne
- seuls le propriétaire ou un utilisateur autorisé peuvent transférer un token
- on ne transfert pas un token à celui qui est déjà son propriétaire
- on ne transfert pas un token à une adresse 0x0, sauf en cas de destruction volontaire.

A ces fonctions implémentant l'interface, il faut ajouter tout ce qui est nécessaire au fonctionnement du token, comme la création ou la destruction des tokens. Mais tout ça fait partie des règles spécifiques que le créateur du contrat souhaite mettre en place.

Et bien entendu, il ne faut pas oublier de préciser quelles sont les spécificités de chaque token qui le rendent unique.

Une implémentation complète de tout ceci est [proposée par OpenZeppelin](https://github.com/OpenZeppelin/openzeppelin-contracts/tree/master/contracts/token/ERC721).

Nous allons partir de cette implémentation et la simplifier au maximum afin d'en tirer un exemple représentatif du coeur d'un NFT.

## Exemple

Nous allons mettre en place un token ERC-721 très simple afin de comprendre le mécanisme. Nous n'allons pas gérer une collection entière, mais un token unique. Nous pouvons presque dire que le contrat sera le token lui-même.

Et n'oublions pas le principal, notre NFT va représenter numériquement une image, dont l'URI sera la donnée spécifique.

Notre contrat va donc comporter quelques spécificités :
- il ne va pas utiliser de moyen d'identifier un token, via son `tokenId`, mais cette notion sera tout de même présente dans les signatures de fonctions afin de respecter le standard.
- le calcul de la balance d'un utilisateur sera simple, s'il est propriétaire du token, sa balance sera de 1, sinon elle sera à 0
- il contiendra une seule adresse approuvée et une liste d'opérateurs approuvés, sans distinction de `tokenId` ou de propriétaire. La différence entre cex deux délégation ne sera pas énorme car il n'y aura pas plusieurs tokens à gérer.
- il contiendra directement l'URI de l'image qu'il représente et non un lien vers un fichier JSON 

### Notre contrat

Voici le code de notre contrat : 

```
pragma solidity ^0.8.0;

contract SimpleERC721 is IERC721, IERC721Metadata, IERC165 {

    using Address for address;

    // owner of token
    address private _owner;

    // Token name
    string private _name;

    // Token symbol
    string private _symbol;
    
    // link to object
    string private _uri;

    // approved address for this token
    address private _tokenApproval;
    
    // Approved operators
    mapping (address => bool) private _operatorApprovals;

    constructor (string memory name_, string memory symbol_, string memory uri_) {
        _owner = msg.sender;
        _name = name_;
        _symbol = symbol_;
        _uri = uri_;
    }

    function balanceOf(address tokenOwner) public view virtual override returns (uint256) {
        require(tokenOwner != address(0), "ERC721: balance query for the zero address");
        if(_owner == tokenOwner)
            return 1;
        else
            return 0;
    }

    function ownerOf(uint256 tokenId) public view virtual override returns (address) {
        return _owner;
    }

    function name() public view virtual override returns (string memory) {
        return _name;
    }

    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
       return _uri;
    }

    function approve(address to, uint256 tokenId) public virtual payable override {
        require(to != _owner, "ERC721: approval to current owner");

        require(msg.sender == _owner || isApprovedForAll(_owner, msg.sender),
            "ERC721: approve caller is not owner nor approved for all"
        );

        _approve(to, tokenId);
    }

    function getApproved(uint256 tokenId) public view virtual override returns (address) {
        return _tokenApproval;
    }

    function setApprovalForAll(address operator, bool approved) public virtual override {
        require(_owner == msg.sender);
        require(operator != msg.sender, "ERC721: approve to caller");
        _operatorApprovals[operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) public view virtual override returns (bool) {
        return _operatorApprovals[operator];
    }

    function _approve(address to, uint256 tokenId) internal virtual {
        _tokenApproval = to;
        emit Approval(this.ownerOf(tokenId), to, 0);
    }

    function transferFrom(address from, address to, uint256 tokenId) public virtual payable override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: transfer caller is not owner nor approved");
        _transfer(from, to, tokenId);
    }
    
    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual payable override {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public virtual payable override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: transfer caller is not owner nor approved");
        _safeTransfer(from, to, tokenId, _data);
    }

    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory _data) internal virtual {
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, _data), "ERC721: transfer to non ERC721Receiver implementer");
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool) {
        return (spender == _owner || getApproved(tokenId) == spender || isApprovedForAll(_owner, spender));
    }

    function _transfer(address from, address to, uint256 tokenId) internal virtual {
        require(_owner == from, "ERC721: transfer of token that is not own");
        require(to != address(0), "ERC721: transfer to the zero address");

        // Clear approvals from the previous owner
        _approve(address(0), tokenId);

       _owner = to;

        emit Transfer(from, to, tokenId);
    }

    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory _data)
    private returns (bool)
    {
        if (to.isContract()) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, _data) returns (bytes4 retval) {
                return retval == IERC721Receiver(to).onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("ERC721: transfer to non ERC721Receiver implementer");
                } else {
                    // solhint-disable-next-line no-inline-assembly
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        } else {
            return true;
        }
    }
    
    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165) returns (bool) {
        return interfaceId == type(IERC721).interfaceId
        || interfaceId == type(IERC721Metadata).interfaceId;
    }    
}

library Address {
    function isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly { size := extcodesize(account) }
        return size > 0;
    }
}
```

### Déploiement et utilisation

Notre NFT va s'instancier avec les données qu'on lui passe dans le constructeur. Nous pouvons le déployer avec [Remix](https://remix.ethereum.org/) par exemple.

Nous pouvons maintenant appeler ses méthodes pour le transférer d'un utilisateur à l'autre. Il pourra même être ajouté dans un wallet comme Metamask. Par contre, on pourra uniquement visualiser sa possession car Metamask ne gère pas le transfert de tokens ERC-721.

## Conclusion

Voilà, nous avons développé et déployé un NFT relativement simple sur Ethereum.

Maintenant, pour monter un réel business sur ce NFT, il nous reste à identifier le type de données dont nous souhaitons équiper nos tokens et à développer dans le smart contract les règles spécifiques de création, échange, destruction ...

Et n'oublions pas que le standard ne permet de gérer les éléments de bases, tels que les échanges et la propriété. Pour tout ce qui concerne ces règles spécifiques, il nous faudra développer une plateforme (site web, échange décentralisé ...) pour que nos utilisateurs puissent interagir confortablement avec notre NFT sans devoir en appeler les fonctions via Remix ou web3 !