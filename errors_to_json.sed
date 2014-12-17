1i\
{

/^#/d
/^\s*$/d
/^Section:/d

# There are duplicate macros for some error codes. Fortunately without the
# spec_name.
/^[[:alnum:]_]+ +[[:alnum:]_]+ +[[:alnum:]_]+$/d

s/^([[:alnum:]_]+) +([[:alnum:]_]+) +([[:alnum:]_]+) +([[:alnum:]_]+)$/	"\1": "\4"/
$!s/$/,/

$a\
}
