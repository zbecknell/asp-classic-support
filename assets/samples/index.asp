<!-- #include file="include/utilities.asp" -->
<!-- #include virtual="Desktop/Virtual/test.asp" -->

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <title>
  <link href="/include/test.css" />

  <style>
    .foo {
      background-color: beige;
      position: absolute;


    }
  </style>
  <div>

  </div>

</head>
<body>
<div>
	<%
	Call Foo("bar")

	Response.Write("foo");

	Call VirtualFoo();

	%>
</div>

  <div class="foo">

  <table>
  <div class="foo"></div>
  <script>
    function foo(bar) {

    }

    foo();
  </script>
</body>
</html>
