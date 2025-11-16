# jsonapi-server

A resource driven framework to set up a {json:api} in record time.

# Usage

See [the guide](./doc/GUIDE.md)

# Features

This handles the JSON:API protocol for you, leaving you just with handling
"search", "create", "delete" and "update" methods for whatever your database is
- it doesn't even have to be SQL-based.

This also has a built-in OpenAPI (Swagger) endpoint

# Limitations

## Belongs-to relationships

These occur when you define a relationship via belongsTo...(), ie meaning the
relationship is not expressed on the object itself

* The `<type>/<id>/<name>` route won't be available [1](#fetching-belongs-to-relationships)
* You won't be able to use `<type>?filter[<name>]=...` even on its own [2](#filtering-by-belongs-to-relationships)
* You won't be able to define the relationship when creating [3](#creating-belongs-to-relationships)

### Fetching belongs-to relationships

It's recommended that instead you request `<other type>?filter[<remote relationship>]=<id>`.

### Filtering by belongs-to relationships

If you want to just filter on the relationship alone, you should instead use
`<other type>/<id>/<remote relationship>`.

### Creating belongs-to relationships

If the relationship is defined remotely, you should instead update the remote
relationship after creating.

## Filter limitations

Filters here are passed into the search handler, and if your handler doesn't
indicate that it supports filters then they are _also_ handled directly by the
framework. The direct filtering support does not currently know how to exclude a
parent object due to it not having any matching _children_, eg. `a?filter[b.c]=d`
will not exclude `a` even if there is no `b` where `c=d`. For a simple case, you
might instead look for `b?filter[c]=d&include=a` and just ignore the main data
in the result. For a more complex case like `a?filter[b.c]=d&filter[e]=f` it's
recommended that you request `b?filter[c]=d`, extract
`data.*.relationships.a.data.id` from the result and then request
`a?filter[id]=<ids>&filter[e]=f`.