File = all:DBML+ { return all.filter(e => e); }

DBML =
  Comment
  / Project
  / Table
  / TableGroup
  / Ref
  / Enum
  / NewLine {}

Project = "Project"i _ name:ProjectName? __ "{" __ options:Options Comment? __ "}" { return { type: "project", name, options } }
ProjectName = Name

Schema = Name

Table = "Table"i _ name:TableName _ alias:TableAlias? _ settings:TableSettings? __ "{" __ items:TableItems Comment? __ "}"
  { return { type: "table", ...name, alias, items, settings }}
TableName = SchemaTableName / SimpleTableName
SchemaTableName = schema:Schema _ "." _ name:Name { return {schema, name}; }
SimpleTableName = name:Name { return {schema: null, name}; }
TableAlias = "as" _ alias:Name { return alias; }
TableItems = (head:TableItem tail:(EOL __ item:TableItem { return item; })* { return [head, ...tail]; })?
TableItem =
  Comment
  / Column
  / Indices
  / option:Option { return { type: "option", option }; }
TableSettings = Settings

Column = name:ColumnName _ data:ColumnType _ settings:Settings? { return { type: "column", name, data, settings } }
ColumnName = Name
ColumnType = prefix:Name _ suffix:$('(' RawName? ')')? { return prefix + suffix }

Indices = "Indexes"i __ "{" __ indices:IndicesList Comment? __ "}" { return { type: "indices", indices }; }
IndicesList = (head:IndexItem tail:(EOL __ index:IndexItem { return index; })* { return [head, ...tail]; })?
IndexItem =
  Comment
  / Index
Index = columns:((name:ColumnName { return [name]; }) / CompositeIndex) _ settings:Settings? _ Comment? { return { columns, settings } }
CompositeIndex = "(" _ entries:(head:CompositeIndexEntry tail:(_ "," _ entry:CompositeIndexEntry { return entry; })* { return [head, ...tail]; } )? _ ")" { return entries; }
CompositeIndexEntry = ColumnName / Function

TableGroup = "TableGroup"i _ name:Name __ "{" __ items:TableGroupItems Comment? __ "}" { return { type: "group", name, items }; }
TableGroupItems = (head:TableGroupItem tail:(EOL __ item:TableGroupItem { return item; })* { return [head, ...tail]; })?
TableGroupItem =
  Comment
  / name:TableName { return {type: "table", ...name} }

Ref = "Ref"i _ name:Name? _ ":" _ from:RefFull _ cardinality:Cardinality _ to:RefFull _ settings:Settings? Comment? { return { type: "ref", cardinality, from, to, settings }; }
RefFull = schemaTable:(n:SchemaTableName _ '.' { return n; } / n:SimpleTableName _ '.' { return n; }) _ columns:RefColumns { return { ...schemaTable, columns } }
RefColumns =
  (name:ColumnName { return [name]; })
  / CompositeKey
Cardinality = '-' / '<>' / '>' / '<'

CompositeKey = "(" _ columns:(head:ColumnName tail:(_ "," _ name:ColumnName { return name; })* { return [head, ...tail]; } )? _ ")" { return columns; }

Enum = "Enum"i _ name:Name __ "{" __  items:EnumValues Comment? __ "}" { return { type: "enum", name, items }}
EnumValues = (head:EnumValue tail:(EOL __ item:EnumValue { return item; })* { return [head, ...tail].filter(i => i); })?
EnumValue =
  name:Name _ settings:Settings? { return { type:"value", name, settings }; }
  / Comment

Name = RawName / QuotedName
RawName = $[a-zA-Z0-9_]+
QuotedName = '"' content:$[^"\n\r]* '"' { return content; }

String = MultiLineString / SingleQuotedString / DoubleQuotedString
MultiLineString = "'''" content:(("'''" { return ""; }) / MultiLineStringContent) { return content; }
MultiLineStringContent = head:. tail:(!"'''" c:. { return c; })* "'''" { return [head, ...tail].join(""); }
SingleQuotedString = "'" content:($[^'\\]+ / "\\'" { return "'" } / [\\])* "'" { return content.join(""); }
DoubleQuotedString = '"' content:($[^"\\]+ / '\\"' { return '"' } / [\\])* '"' { return content.join(""); }

Comment = comment:(SingleLineComment / MultiLineComment) { return {type: "comment", comment} }
SingleLineComment = _ "//" _ comment:LineOfText { return comment; }
MultiLineComment = "/*" comment:(("*/" { return ""; }) / MultiLineCommentContent) { return comment; }
MultiLineCommentContent = head:. tail:(!"*/" c:. { return c; })* "*/" { return [head, ...tail].join(""); }
LineOfText = text:$([^\n\r]*)

Settings = "[" pairs:SettingsPairs "]" { return pairs; }
SettingsPairs = (head:Setting tail:(_ "," _ setting:Setting _ { return setting; })* { return [head, ...tail].reduce((a, b) => Object.assign(a,b), {}); })?
Setting = key:SettingKey _ value:(":" _ v:SettingValue { return v; })? { return {[key]: value}; }
SettingKey = [^,\]:]+ { return text().trim(); }
SettingValue = String / Function / ([^,\]]+ { return text().trim(); })

Function = '`' [^`]* '`' { return text(); }

Options = (head:Option tail:(EOL __ opt:Option { return opt; })* { return [head, ...tail].reduce((a, b) => Object.assign(a, b), {}); })?
Option = key:OptionKey _ ":" _ value:OptionValue _ Comment?
  { return { [key]: value } }
OptionKey = Name
OptionValue = String

_ "space" = [ \t]*
__ "whitespace" = [ \t\n\r]*
EOL = NewLine / (Comment NewLine) / EOF
NewLine = '\n' / '\r' '\n'
EOF = !.
