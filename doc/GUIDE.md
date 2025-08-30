# Usage Guide

## The basics of JSON:API

You can just pop over to https://jsonapi.org to see the specification, but the
short of it is:

* Every resource has a _type_ that matches the collection name
* Every resource has an _id_, which is unique
* Every resource can have _relationships_, which roughly correspond to the
  relational database concept of _foreign keys_.
* Every resource can have _attributes_, which are pretty much everything else
  about the resource.
* You can request one specific resource by GETing `<type>/<id>`; you can
  also DELETE to the same resource
* You can PATCH `<type>/<id>` to modify a single resource - including with
  a partial update to the attributes.
* You can request multiple resources by GETing `<type>` - and you can
  filter and paginate; you can create a resource by POSTing to `<type>`.
* You can also operate directly on the relationships at
  `<type>/<id>/relationships/<name>`, which works similarly to operating
  on `<type>`.
* Whether you're fetching a collection or a single resource, you can ask for
  related resources to be included so you don't have to fetch them separately.
* You can also request the resources specifically via a relationship by GETing
  `<type>/<id>/<name>`, which behaves either like a single resource or
  like a collection.

This all means your client code can operate on your database very much as a
collection of related objects rather than using a series of bespoke endpoints
which might not be very predictable.

*Note: you might think of the `<type>` collections as "__the__ collections",*
*with all other collections being secondary*

## Client Usage

### Differences from other JSON:API servers

This supports pagination via the fields "limit" (page size) and "offset" (how
many items to skip). This is in the "page" query family, so you might use
`page[limit]=10` for example.

Filtering is a key (a local attribute, relationship, or "id") mapped to:

* "<" followed by a string/number to express "less than"
* ">" followed by a string/number to express "greater than"
* "~" followed by a string to express a case-insensitive match
* ":" followed by a string to express that the filter string is part of the
  target (string).
* Anything else, which will be taken as an exact (string) match.

You can supply multiple of these as an array, or multiple comma-separated. These
are in the "filter" query family, so a valid query might include
`filter[a]=:foo,:bar` or `filter[a][]=:foo&filter[a][]=:bar`.

## Configuring Resources

### Relationships

There are four types of relationship views:

* "one": A to-one relationship where the remote entity is identified when
  fetching the local entity, eg. a relationship to a 'parent' object. You set
  these up with `Relationship.oneOf()`.
* "many": A to-many relationship where all the remote entities are identified
  when fetching the local entity. These are normally a bad idea to use; see
  "belongs to many" below. You set these up with `Relationship.manyOf()`.
* "belongs to one": A to-one relationship where the remote entity is not
  identified when fetching the local entity. This might be useful where an
  entity is defined as the only one for its 'parent', eg. a one-to-one
  relationship where the ID field is on the other entity. You set these up with
  `Relationship.belongsToOneOf()`. Despite the name, ownership is not implied
  here - in fact it's likely to be the opposite way around.
* "belongs to many": A to-many relationship where the remote entities are not
  identified when fetching the local entity. This is normally the case for
  one-to-many, where including the child entities would normally involve
  exponentially more work. You set these up with
  `Relationship.belongsToManyOf()`.

Belongs-to relationships generally are expressed like:

```js
photos: Relationship.belongsToManyOf({
    resource: "photo",
    as: "photographer"
})
```

That corresponds to the other side's:

```js
photographer: Relationship.oneOf("creator")
```

With this, the server knows that when you ask for `creator/<id>?include=photos` it
should go looking for `photo?filter[creator]=<id>`.