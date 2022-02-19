<%

''' <summary>A test class for symbols.</summary>
Class TestClass

    ''' <summary>A test property; should only show in the context of TestClass...</summary>
	Property Get Bar
	End Property

End Class

Empty

''' <summary>A real big fooey function.</summary>
''' <param name="bar">A bar param.</param>
''' <param name="another">Another parameter.</param>
''' <param name="andAnother">And another.</param>
Function Foo(bar, another, andAnother)
    ''' <summary>My foo variable</summary>
    Dim myVariable

    Response.Write();


	Response.CacheControl = "True"
	Response.Buffer = false

    myVariable

    Foo("Fooey", "booey", "Chooey")

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