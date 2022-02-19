<%

''' <summary>A test class for symbols.</summary>
Class TestClass

    ''' <summary>A BAR test property; should only show in the context of TestClass...</summary>
	Property Get Bar
	End Property

    ''' <summary>A BAZ test property; should only show in the context of TestClass...</summary>
	Property Get Baz
	End Property

End Class

Function Foo()
    ''' <summary>Should only show in the context of Foo.</summary>
    Dim Bar

End Function


%>