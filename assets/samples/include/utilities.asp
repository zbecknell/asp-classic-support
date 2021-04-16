<%

''' <summary>A test class for symbols.</summary>
Class TestClass

    ''' <summary>A test property. Should only show in the context of TestClass...</summary>
	Property Get Bar
	End Property

End Class

''' <summary>Some foo function.</summary>
''' <param name="bar">Some bar parameter.</param>
Function Foo(bar)

    Dim myVariable = bar

	Response.CacheControl = "True"
	Response.Buffer = false

	Response.Write()

End Function

%>

<script>
    function aJavascriptFunction(blarg) {  <% Debug.WriteLine %>
        var someJavascriptVariable;
    }
</script>