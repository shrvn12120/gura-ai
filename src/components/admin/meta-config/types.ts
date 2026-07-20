export type FieldType =
  | "boolean"
  | "string"
  | "number"
  | "textarea"
  | "select"
  | "array";


export interface MetaField {

  key:string;

  label:string;

  type:FieldType;

  placeholder?:string;

  defaultValue?:any;

  options?:{
    label:string;
    value:string;
  }[];

  itemSchema?:MetaField[];

}



export interface SubCategory {

  name:string;

  fields:MetaField[];

}



export interface MetaConfig {

  _id?:string;

  category:string;

  subCategories:SubCategory[];

}