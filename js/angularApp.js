var evotacleApp = angular.module('evotacleApp', [])

// Factory that encapusles a Ressource class.
/*
 * Used to register new Ressources to the Game and to
 * manage modifications in quantity in respect to
 * boundaries.
 */
evotacleApp.factory("Ressources",[
  "$rootScope",
  function($rootScope){
    var Ressources = []

    class Ressource{
      constructor(label,group,imgURL,description,min,max){
        this.name = label

        Ressources.push(this)

        this.icon = "sym_tag_blank.svg"
        if(!typeof imgURL === "undefined") this.setIcon(imgURL)

        this.description = "No description given."
        if(!typeof description === "undefined") this.setDescription(description)

    		this.min = null
    		this.max = null
        if(!(typeof min === "undefined" && typeof max === "undefined")) this.setLimits(min,max)

        this.group = "default"
        if(!typeof group === "undefined") this.setGroup(group)
      }

      setName(string){
        this.name = string
        return this
      }
      setIcon(string){
        this.icon = string
        return this
      }
      setDescription(string){
        this.description = string
        return this
      }
      setLimits(intA,intB){
        if(intA<intB){
          this.min = intA
          this.max = intB
        }else{
          this.max = intB
          this.min = intA
        }
      }
      setLowOnly(int){
        this.min = int
        this.max = null
      }
      setHighOnly(int){
        this.max = int
        this.min = null
      }
      unsetLimits(){
        this.min = null
        this.max = null
      }
      //TODO This should probably report if a new group was created or not.
      //TODO $emit event to notify.
      setGroup(string){
        this.group = string
      }

      //Applies an offset to a target number value, respecting the min and max limitations.
      apply(current,offset){
        var tmp = current+offset
        if(this.min != null)
          tmp = Math.max(this.min,tmp)
        if(this.max != null)
          tmp = Math.min(this.max,tmp)
        return tmp
      }

      //Returns the reference to a Ressource if it exists. Otherwise returns null
      static getRessource(string){
        var filter = Ressources.filter((a)=>a.name==string)
        return filter.length>0?filter[0]:null
      }
      //Returns all referneces to Ressources fitting a group
      static getRessourcesByGroup(string){
        return Ressources.filter((a)=>a.group==string)
      }
    }

    return {
      Class:Ressource,
      Instances:Ressources
    }
  }
])


// Factory that encapusles a Player class.
/*
 * Used to register new Players to the Game, wiring them
 * to the ressource pools avalible in the game..
 */
evotacleApp.factory("Players",[
	"$rootScope",
	"Ressources",
	function($rootScope,Ressources){
		var Players = []

		var counter = 0

		// Private Helpers

    /*
     * Helper that creates a new Reference to a ressource pool
     * if the player hadn't had access to that ressource pool
     * before. Otherwise manipulates the players ressource pool
     * accordingly.
     */
		var HelperSetRessource = function (Player,Ressource,value){
			var matchingRessRef = Player.ressources.filter(function(a){
		  		return a.Ressource == Ressource
			})
		  	var isTracked = matchingRessRef.length > 0
			if(!isTracked){
	    	Player.ressources.push(new RessRef(Ressource,value))
			}else{
	    	matchingRessRef[0].apply(value)
			}
		}

  	class Player{
  		constructor(){
        this.name = "Unknown Spec."
        this.description = "No details availible..."
        this.ressources = []
        Players.push(this)
  		}

			//Returns a single number
			getRessource(string){
				var matchingRess = this.ressources.filter(function(a){
					return a.Ressource.name == string
				})
				return matchingRess.map((a)=>a.value).reduce( (a,b) => (a+b) , 0 )
			}
			//Returns an array of JSON objects string & val
			getRessourcesByGroup(string){
				var matchingRess = this.ressources.filter((a)=>a.Ressource.group == string).map(function(input){
					return {
						name:input.Ressource.name,
						value:input.value
					}
				})
				return matchingRess
			}

			//Set the value of a Ressource
			setRessource(string,value){
				var matchingRess = Ressources.Instances.filter((a)=>a.name==string)
				if(matchingRess.length > 0){
					HelperSetRessource(this,matchingRess[0],value)
				}
			}
			//Modifies the value of a Ressource
			modRessource(string,value){
				var Ress = Ressources.Class.getRessource(string)
				if(Ress){
					var matchingRessRef = this.ressources.filter((a)=>a.Ressource===Ress)
					var isTracked = matchingRessRef.length != 0
					if(!isTracked){
						this.ressources.push(new RessRef(Ress,value))
					}else{
						HelperSetRessource(this,Ress,value)
					}
				}
			}
    }

    //This is a little helper class connecting players to the ressource pool.
    class RessRef{
      	constructor(Ress,v){
	        this.Ressource = Ress
	        this.value = 0
	        this.apply(v)
	    }
			apply(value){
    		this.value = this.Ressource.apply(this.value,value)
      }
    }

    return{
    	Class:Player,
    	Instances:Players
    }
	}
])

//Sets up the base Game
evotacleApp.run([
  "$rootScope",
  "Ressources",
  "Players",
  function($rootScope,Ressources,Players) {
		//Initializes basic Game Ressources
		var BasicRessources = [
			(new Ressources.Class("Nutrients"))
				.setDescription("Universal nutritioush fluid used by tentacles that serves as an energy supply.")
				.setIcon("img/sym_nutrient.svg"),
			(new Ressources.Class("Amino Acids"))
				.setDescription("Essential amino acids that cannot be produced by tentacles and the hive. Needed for advanced morphs and mutations.")
				.setIcon("img/sym_amino2.svg"),
			(new Ressources.Class("Eggs"))
        .setDescription("Energy-packed vessels that deliver the next step in evolution.")
				.setIcon("img/sym_egg.svg"),
			(new Ressources.Class("Tentacles"))
        .setDescription("Unclassified lifeforms that consists of a cluster of wormshaped appendages.")
				.setIcon("img/sym_tacles.svg")
		]
		BasicRessources.map(function(BasicRessource){
			BasicRessource.setLowOnly(0)
		})
		new Players.Class()
}])

// Factory bridging from angular to Snap.svg allowing to render SVGs
evotacleApp.factory("MapView",["$rootScope",function($rootScope){
  var Map = Snap("#Map")
  var Mouse = {
    x:0,
    y:0
  }
  Map.mousemove(function(e,x,y){
    Mouse.x = x
    Mouse.y = y
    //Inverse Transform
  })
  Map.click(function(e,x,y){
    var tPoint = Map.node.createSVGPoint()
    tPoint.x = x
    tPoint.y = y
    tPoint = tPoint.matrixTransform(Map.node.getScreenCTM().inverse())
    console.log({"Sending Point":tPoint})
    $rootScope.$emit("Game.Popup",tPoint);
  })

  function load(img){
    var def = Snap("#Map").select("defs #"+img)
    if(!def){
    Snap.load("img/"+img+".svg",function(data){
      if(data){
        var tmpSVG = data.select("*")
        var tGroup = Snap("#Map").g()
        tGroup.add(tmpSVG)
        tmpSVG = tGroup.select("*")
        tmpSVG.attr({"id":img})
        tmpSVG.toDefs()
        tGroup.remove()
      }
    })}
    return def
  }

  function addElement(layer,img,x,y,action,singleUse){
    if(typeof singleUse === undefined) singleUse = false
    if(typeof action === "function"){
      var tClick = function(e){
        e.stopPropagation()
        action(e,this)
      }
      if(singleUse){
        tClick = function(e){
          e.stopPropagation()
          this.unclick(tClick)
          action(e,this)
        }
      }
    }
    load(img)
    return Snap("#Map").g().attr({transform:"t"+x+" "+y}).use("#"+img).hover(function(){
      this.animate({transform:"s0.09"},100)
    },function(){
      this.animate({transform:"s0.07"},100)
    }).click(tClick)
  }

	//For a single Click Only
	Snap.plugin(function(Snap,Element,Paper,glob){
		Element.prototype.singleClick = function(action,propagate){
			if(typeof propagate === undefined) propagate = false
				var actionHandle = function(e){
				if(!propagate) e.stopPropagation()
				this.unclick(actionHandle)
				action.apply(this,arguments)
			}
			this.click(actionHandle)
			return this
		}
		//TODO This may be wrong
		Element.prototype.position = function(){
			return {
				x:this.transform().localMatrix.e,
				y:this.transform().localMatrix.f
			}
		}
	})

	return {
		addElement:addElement
	}
}])

// Game Core controller
/*
 * Manipulates the Game Data, consumes Game.Events, and contains the main game loop.
 */
evotacleApp.controller("GameController",[
	"$scope",
	"$rootScope",
	"$interval",
	"Ressources",
	"Players",
	"MapView",
	function($scope, $rootScope, $interval, Ressources, Players, MapView){
    $scope.Ressources = Ressources.Instances
    $scope.Player = new Players.Class()
		console.log($scope.Player)

    $scope.Player.setRessource("Nutrients",20)
    $scope.Player.setRessource("Tentacles",1)
    $scope.Player.setRessource("Eggs",0)
    $scope.Player.setRessource("Amino Acids",5)

    // Helper function fetching all ressources avalible to a player.
		$scope.getPlayerRessources = function(){
			var output = []
			$scope.Player.ressources.forEach(function(RessRef){
				output.push(RessRef)
			})
			return output
		}
		$scope.playerRessources = $scope.getPlayerRessources();

    // Handler that create a little tag on the MapView.
    $rootScope.$on("Game.Popup",function(e,data){
      MapView.addElement(null,"sym_tag_blank",data.x,data.y).hover(function(){
        this.animate({transform:"s1.2"},100)
      },function(){
        this.animate({transform:"s1"},100)
      }).singleClick(function(){
        this.remove()
      })
    })

    // Main Game Loop - that updates ressources.
    $rootScope.$on("Game.Step",function(e){
      $scope.Player.modRessource("Nutrients",1)
      if((Math.random() * 20).toFixed(0) == 0){
        $scope.Player.modRessource("Amino Acids",1)
        console.log("Essential Amino Acids have been discovered by your tentacles.")
      }
      var consumption = $scope.Player.getRessource("Tentacles") * 5 * Math.random()
      $scope.Player.modRessource(-consumption.toFixed(0))
      if(
        $scope.Player.getRessource("Nutrients") > 50 &&
        $scope.Player.getRessource("Amino Acids") > 5 &&
        (Math.random() * 5).toFixed(0) == 0
      ){
        $scope.Player.modRessource("Nutrients",-50)
        $scope.Player.modRessource("Amino Acids",-5)
        $scope.Player.modRessource("Eggs",1)
        console.log("An egg was spawn by your tentacles.")
      }
      $scope.$digest()
    })
  }
])

// Directive that controls the main loop of the game via Pause/Unpause Events.
evotacleApp.directive("ngProgressEvent",['$rootScope',function($rootScope){
  return {
    scope:{},
    link:function ($scope, element, attrs, controller, transcludeFn) {
      var element = element[0]
      element.addEventListener("animationiteration", function(){
        $rootScope.$emit("Game.Step")
      }, false);
      $rootScope.$on("Game.Pause",function(e,data){
        element.style.animationPlayState = "paused"
      })
      $rootScope.$on("Game.Resume",function(e,data){
        element.style.animationPlayState = "running"
      })
      $rootScope.$on("Game.Speed",function(e,data){
        element.style.animationDuration = data+"s"
      })
      $rootScope.$emit("Game.Resume")
    }
  }
}])

// Directive that binds a function call as a handler when an HTML element is clicked.
evotacleApp.directive("ngClickHandle",['$rootScope',function($rootScope){
  return {
    scope:false,
    link:function ($scope, element, attrs, controller, transcludeFn) {
      var element = element[0]
      element.addEventListener("click", function(){
        if($scope.hasOwnProperty(attrs.ngClickHandle) && typeof $scope[attrs.ngClickHandle] === "function"){
          $scope[attrs.ngClickHandle](element)
        }else{
          //This is for debug
          console.log("Click Handle "+attrs.ngClickHandle+" is not a function...")
        }
      }, false);
    }
  }
}])

// TODO Unfinsihed
// Stump for a directive that wires HTML element to Game-Events allowing them to change attributes accordingsly.
evotacleApp.directive("ngReciever",['$rootScope',function($rootScope){
  return {
    scope:false,
    link:function ($scope, element, attrs, controller, transcludeFn) {
      var element = element[0]
      if($scope.hasOwnProperty(attrs.ngReciever) && typeof $scope[attrs.ngReciever] === "function"){
        $scope[attrs.ngReciever](element)
      }else{
        console.log("Reciever "+attrs.ngReciever+" is not a function...")
      }
    }
  }
}])

// Controller containing the most basic game states: Running and Paused
//  that also allows to manipulate the simulation speed..
evotacleApp.controller("ViewController",["$scope","$rootScope",function($scope,$rootScope){
  $scope.index = 0
  $scope.playToggle = function(element){
    if(element.getAttribute("status") == "paused"){
      $rootScope.$emit("Game.Resume")
    }else{
      $rootScope.$emit("Game.Pause")
    }
  }
  $scope.playStateReciever = function(element){
    $rootScope.$on("Game.Resume",function(){
      element.setAttribute("status","running")
    })
    $rootScope.$on("Game.Pause",function(){
      element.setAttribute("status","paused")
    })
  }
  $scope.speed = function(element){
    if(!element.hasAttribute("speed")){
      element.setAttribute("speed",1)
    }
    element.getAttribute("speed") == 1 ? element.setAttribute("speed",0.1) : element.setAttribute("speed",1)
    $rootScope.$emit("Game.Speed",element.getAttribute("speed"))
    $rootScope.$emit("Game.Resume")
  }
}])
