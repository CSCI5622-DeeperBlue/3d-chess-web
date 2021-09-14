So we need to mix react with babylon js, these two do not mix well. 

App: 
We also need to separate out the API from the babylonJS code, this shoudl likely be done with WS (to allow pushes) and should be implented at a higher level. 
The babylonJS is setup to have one big file basically, it could be its own class that is initiated and called, then methods called to update each of it, 
there would need to be passed up callbacks for the WS/REST API. 
 
