<%

''' <summary>A test class for symbols.</summary>
Class TestClass

    ''' <summary>A test property; should only show in the context of TestClass...</summary>
	Property Get Bar
	End Property

End Class

''' <summary>Fooey...</summary>
''' <param name="bar">Barry!</param>
Function Foo(bar)

    Dim myVariable = bar

	Response.CacheControl = "True"
	Response.Buffer = false
    
	Response.Write()
End Function

%>

<div class="foo"></div>

<div>

<script>
    function foo(bar) {
        setTimeout(() => {
            
        }, timeout);
        // testing
        for (let i = 0; i < myThing.length; i++) {
            const element = myThing[i];
        }

    }
</script>