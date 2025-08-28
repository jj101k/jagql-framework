<h1 align="center">
<img src="https://github.com/jagql/framework/raw/master/resources/images/jagql.svg?sanitize=true" width=200>
<br>
jagql
</h1>

<p align="center">
  <a href="https://jagql.github.io">
    <img src="https://img.shields.io/badge/USAGE-GUIDE-5599dd.svg?longCache=true&style=for-the-badge">
  </a>
  <br>
  <a href="https://jagql.github.io/framework/">
    <img src="https://img.shields.io/badge/DOCS-API_REFERENCE-6699ff.svg?longCache=true&style=for-the-badge">
  </a>
</p>

- - - - - -


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

These occur when you define a relation via belongsTo...(), ie meaning the
relationship is not expressed on the object itself

* The `<type>/<id>/<name>` route won't be available
* You won't be able to use `<type>?filter[<name>]=...` even on its own
* You won't be able to define the relation when creating
*