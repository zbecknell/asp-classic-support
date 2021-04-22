/* eslint-disable max-len */

import { Position, TextDocument } from "vscode";
import { getAspRegions } from "./region";
import { AspRegion } from "./types";

/**
 * Matches a Function
 * 
 * 1. Comment
 * 2. Definition
 * 3. Function/Sub
 * 4. Signature def
 * 5. Name
 * 6. Params
 * 
 * [Link](https://regex101.com/r/vQ4rYJ/1)
 */
export const FUNCTION = /((?:^[\t ]*'+.*$(?:\r\n|\n))*)^[\t ]*((?:(?:Public|Private)[\t ]+)?(Function|Sub)[\t ]+((\[?[a-z]\w*\]?)[\t ]*(?:\((.*)\))?))/img;

/**
 * Matches a Class
 * 
 * 1. Comment
 * 2. Definition
 * 3. Name
 * 
 * [Link](https://regex101.com/r/j2BtJ6/1)
 */
export const CLASS = /((?:^[\t ]*'+.*$(?:\r\n|\n))*)^[\t ]*((?:(?:Public|Private)[\t ]+)?Class[\t ]+(\[?[a-z]\w*\]?))/img;

/**
 * Matches a Property
 * 
 * 1. Comment
 * 2. Definition
 * 3. Get/Let/Set
 * 4. Name
 * 5. Params
 */
export const PROP = /((?:^[\t ]*'+.*$(?:\r\n|\n))*)^[\t ]*((?:Public[\t ]+(?:Default[\t ]+)?|Private[\t ]+)?Property[\t ]+(Get|Let|Set)[\t ]+(\[?[a-z]\w*\]?))(?:\((.*)\))?/img;

/**
 * Matches a Variable Declaration
 * 
 * 1. Type
 * 2. Name (cs)
 */
// export const VAR = /(?<!'\s*)(?:^|:)[\t ]*(Dim|Set|Const|Private[\t ]+Const|Public[\t ]+Const|Private|Public)[\t ]+(?!Sub|Function|Class|Property)([a-z0-9_]+(?:[\t ]*\([\t ]*\d*[\t ]*\))?(?:[\t ]*,[\t ]*[a-z0-9_]+(?:[\t ]*\([\t ]*\d*[\t ]*\))?)*)[\t ]*.*(?:$|:)/img;
export const VAR = /(?<!'\s*)(?:^|:)[\t ]*(Dim|Set|Const|Private[\t ]+Const|Public[\t ]+Const|Private|Public)[\t ]+(?!Sub|Function|Property)([a-z0-9_]+(?:[\t ]*\([\t ]*\d*[\t ]*\))?(?:[\t ]*,[\t ]*[a-z0-9_]+(?:[\t ]*\([\t ]*\d*[\t ]*\))?)*)[\t ]*.*(?:$|:)/img;

export const VAR_COMPLS = /^[\t ]*(Dim|Const|((Private|Public)[\t ]+)?(Function|Sub|Class|Property [GLT]et))[\t ]+\w+[^:]*$/i; // fix: should again after var name #22

/**
 * Matches a Definition
 * 
 * 1. Comment
 * 2. Definition
 * 3. Name
 */
export function DEF(input: string, word: string): RegExpExecArray {
  return new RegExp(
    `((?:^[\\t ]*'.*$(?:\\r\\n|\\n))*)^[^'\\n\\r]*^[\\t ]*((?:(?:(?:(?:Private[\\t ]+|Public[\\t ]+)?(?:Class|Function|Sub|Property[\\t ][GLS]et)))[\\t ]+)(\\b${word}\\b).*)$`
    , "im"
  ).exec(input);
}

export function DEFVAR(input: string, word: string): RegExpExecArray {
  return new RegExp(
    `((?:^[\\t ]*'.*$(?:\\r\\n|\\n))*)^[^'\\n\\r]*^[\\t ]*((?:(?:Const|Dim|(?:Private|Private)(?![\\t ]+(?:Sub|Function)))[\\t ]+)[\\w\\t ,]*(\\b${word}\\b).*)$`
    , "im"
  ).exec(input);
}

/**
 * Matches a comment summary.
 * 
 * 1. Summary text
 * 
 * [View](https://regex101.com/r/IIfp1I/1)
 */
export const COMMENT_SUMMARY = /(?:\s*<summary>\s*)([^<]*)(?:<\/summary>)?/img

/**
 * Matches 1 or more parameter summaries
 * 
 * 1. Parameter name
 * 2. Summary text
 * 
 * [View](https://regex101.com/r/CMza61/1)
 */
export const PARAM_SUMMARIES = /(?:\s*<param name=["'](\w+)["'].*?>\s*)([^<]*)(?:<\/param>)?/img

export function PARAM_SUMMARY(input: string, parameterName: string): RegExpExecArray {
  return new RegExp(`'''\\s*<param name=["']${parameterName}["']>(.*)<\\/param>`, "i").exec(input);
}

/** Matches the end of a class, function, or property region. */
export const ENDLINE = (/(?:^|:)[\t ]*End\s+(Sub|Class|Function|Property)/i);

export const ARRAYBRACKETS = /\(\s*\d*\s*\)/;

export const COLOR = /\b(vbBlack|vbBlue|vbCyan|vbGreen|vbMagenta|vbRed|vbWhite|vbYellow)\b|\b(RGB[\t ]*\([\t ]*(&h[0-9a-f]+|\d+)[\t ]*,[\t ]*(&h[0-9a-f]+|\d+)[\t ]*,[\t ]*(&h[0-9a-f]+|\d+)[\t ]*\))|(&h[0-9a-f]{6}\b)/ig;


/** Find opening and closing brackets for ASP code
 * 1) Opening tag
 * 2) Closing tag 
 */
export const ASP_BRACKETS = /(<%=|<%|%>)+/g;

/** Matches lines which can be thrown away in informal doc comments like:
 * 
 * '********** 
 */
export const DOC_SEPARATOR = /['\*\s-]+$/