'use strict'

import { addRelationship } from "./addRelationship.js"
import { createRoute } from "./create.js"
import { deleteRoute } from "./delete.js"
import { findRoute } from "./find.js"
import { relatedRoute } from "./related.js"
import { relationshipsRoute } from "./relationships.js"
import { removeRelationship } from "./removeRelationship.js"
import { searchRoute } from "./search.js"
import { updateRoute } from "./update.js"
import { updateRelationship } from "./updateRelationship.js"

/**
 *
 */
export class routes {
    /**
     * @param {import("../Router.js").Router} router
     * @param {import("../ConfigStore.js").ConfigStore} configStore
     * @param {import("../responseHelper.js").responseHelper} responseHelper
     * @param {import("../RelationshipStore.js").RelationshipStore} relationshipStore
     */
    static async register(router, configStore, responseHelper, relationshipStore) {
        const handlers = [
            addRelationship,
            createRoute,
            deleteRoute,
            findRoute,
            relatedRoute,
            relationshipsRoute,
            removeRelationship,
            searchRoute,
            updateRoute,
            updateRelationship,
        ]
        for (const handler of handlers) {
            handler.register(router, configStore, responseHelper, relationshipStore)
        }
    }
}