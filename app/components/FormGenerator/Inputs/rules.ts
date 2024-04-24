import { JSONSchemaType } from "ajv";
import { InputUnion, Schema } from "../types";
import { FormatName } from 'ajv-formats'

type JSONSchemaTypes = 'number' | "integer" | "string" | "boolean" | "array" | 'object' | 'null'

const inputKindToJSONSchemaType: Record<InputUnion['kind'], JSONSchemaTypes> = {
    alphanumeric: "string",
    email: "string",
    alphabetic: "string",
    password: "string",
}
const inputKindToJSONSchemaFormat: Record<InputUnion['kind'], FormatName | undefined> = {
    alphanumeric: undefined,
    alphabetic: undefined,
    email: "email",
    password: "password",
}

export const buildJsonSchema = (schema: Schema) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jsonSchema: Record<string, any> = {
        type: "object",
        additionalProperties: false,
        properties: {},
        required: [],
    };

    schema.forEach((field) => {
        const { kind } = field;
        const jsonSchemaType = inputKindToJSONSchemaType[kind];
        const jsonSchemaFormat = inputKindToJSONSchemaFormat[kind];

        const baseSchema: Record<string, unknown> = {
            type: jsonSchemaType,
            errorMessage: {},
        }

        if (kind === 'email') {
            baseSchema.format = jsonSchemaFormat;
            baseSchema.errorMessage = {
                format: "Invalid email address",
                required: "Email is required",
            };
        }

        if (kind === 'alphanumeric') {
            baseSchema.minLength = field.minLength ? field.minLength : field.required ? 1 : undefined;
            baseSchema.pattern = "^[a-zA-Z0-9]*$";
            baseSchema.errorMessage = {
                minLength: field.minLength ? `Minimum length is ${field.minLength}` : field.required ? "Field is required" : undefined,
                pattern: "Only alphanumeric characters are allowed",
            };
        }

        if (kind === 'alphabetic') {
            baseSchema.minLength = field.minLength ? field.minLength : field.required ? 1 : undefined;
            baseSchema.pattern = "^[a-zA-Z]*$";
            baseSchema.errorMessage = {
                minLength: field.minLength ? `Minimum length is ${field.minLength}` : field.required ? "Field is required" : undefined,
                pattern: "Only alphabetic characters are allowed",
            };
        }

        jsonSchema.properties[field.name] = baseSchema;
        if (field.required) {
            jsonSchema.required.push(field.name);
        }
    });

    return jsonSchema as JSONSchemaType<unknown>;
}