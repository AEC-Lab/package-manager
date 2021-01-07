import { Request } from "express";
import * as _ from "lodash";
const Validator = require("jsonschema").Validator;

import { db } from "../config/fbConfig";

// @desc    endpoint to validate a .package schema file
// @route   POST /validate
// @access  Public
export const validatePackageSchema = (request: Request, response: any) => {
  if (request.method !== "POST") return response.status(405).send("Only POST Requests Are Accepted");

  const deployerData = request.body;
  const { version } = deployerData;

  db.collection("schemas")
    .doc(version.toString())
    .get()
    .then(doc => {
      const schema = doc.data();
      const v = new Validator();
      const result = v.validate(deployerData, schema);
      result.valid ? response.status(200).send("Validated!") : response.status(400).send(result.errors);
    })
    .catch((error: string) => {
      console.error(new Error(error));
      response.status(501).send(`Cannot Find Schema Version: ${version}`);
    });
};
