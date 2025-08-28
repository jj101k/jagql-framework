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

## Configuring Resources

### Relations

There are four types of relationship views:

* "one": A to-one relationship where the remote entity is identified when
  fetching the local entity, eg. a relationship to a 'parent' object. You set
  these up with `Relation.oneOf()`.
* "many": A to-many relationship where all the remote entities are identified
  when fetching the local entity. These are normally a bad idea to use; see
  "belongs to many" below. You set these up with `Relation.manyOf()`.
* "belongs to one": A to-one relationship where the remote entity is not
  identified when fetching the local entity. This might be useful where an
  entity is defined as the only one for its 'parent', eg. a one-to-one relation
  where the ID field is on the other entity. You set these up with
  `Relation.belongsToOneOf()`. Despite the name, ownership is not implied here -
  in fact it's likely to be the opposite way around.
* "belongs to many": A to-many relationship where the remote entities are not
  identified when fetching the local entity. This is normally the case for
  one-to-many, where including the child entities would normally involve
  exponentially more work. You set these up with `Relation.belongsToManyOf()`.

Belongs-to relations generally are expressed like:

```js
photos: Relation.belongsToManyOf({
    resource: "photo",
    as: "photographer"
})
```

That corresponds to the other side's:

```js
photographer: Relation.oneOf("creator")
```

With this, the server knows that when you ask for `creator/<id>?include=photos` it
should go looking for `photo?filter[creator]=<id>`.