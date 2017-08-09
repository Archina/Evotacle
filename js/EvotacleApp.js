var Evotacle = angular.module('Evotacle', [])

// Factory that encapusles a Ressource class.
/*
 * Used to register new Ressources to the Game and to
 * manage modifications in quantity in respect to
 * boundaries.
 */
Evotacle.factory("Ressources",[
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
Evotacle.factory("Players",[
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

      static getPlayerByName(string){
        var tmpPlayer = Players.filter((tPlayer)=>tPlayer.name===string)
        if(tmpPlayer.length > 0){
          return tmpPlayer[0]
        }
        return null
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

// This factories purpose is to create chunk objects that can be resolved to modifier attributes of a player.
Evotacle.factory("Resolveable",["$rootScope","Players","Ressources",
  function($rootScope,Players,Ressources){
    var factory = {}

    class Resolveable{
      resolve(){}
    }

    factory.checkResolveable = function(object){
      return object instanceof Resolveable
    }

    factory.PlayerModifier = class PlayerModifier extends Resolveable{

      constructor(pString,rString){
        super()
        this.setPlayer(pString)
        this.setResource(rString)
        this.setAmount(0)
      }

      setPlayer(string){
        this.targetPlayer = Players.Class.getPlayerByName(string)
      }

      setResource(string){
        this.targetResource = Ressources.Class.getRessource(string)
      }

      setAmount(float){
        this.amount = float
      }

      resolve(){
        this.targetPlayer.modRessource(this.targetResource.name,this.amount)
        $rootScope.$emit("Player.Updated")
      }

    }

    return factory
  }
])

// Evotacle.controller("PlayerController",["$scope","$rootScope","Players",
//   function($scope,$rootScope,Players){
//
//     $scope.getPlayer(string){
//       var tmpPlayers = Players.filter((a)=>a.name===string)
//       if(tmpPlayers.length > 0){
//         return tmpPlayers[0]
//       }
//       return null
//     }
//
//     $rootScope.$on("Player.Resource",function(e,data){
//       var player = $scope.getPlayer(data.player)
//       var resource = data.resource
//       var modFunc = data.mod
//       var tmpResource = player.getRessource(resource)
//       player.setRessource(resource,modFunc(player,tmpResource))
//     })
//
//   }
// ])

//Sets up the base Game
Evotacle.run([
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
}])

// Factory bridging from angular to Snap.svg allowing to render SVGs
Evotacle.factory("MapView",["$rootScope","Resolveable",function($rootScope,Resolveable){
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

    var data = tPoint.matrixTransform(Map.node.getScreenCTM().inverse())

    var targets = ["sym_egg","sym_amino2","sym_file","sym_nutrient","sym_tacles","sym_dna","sym_flask"]
    data.res = targets[( parseInt( Math.random()*targets.length-0.0001 ) )]

    data.duration = 3

    data.resolve = new Resolveable.PlayerModifier("Unknown Spec.","Nutrients")
    data.resolve.setAmount(50)

    console.log({"Sending Point":data})
    $rootScope.$emit("Game.Popup",data);
  })

  function load(img){
    var def = Snap("#Map").select("defs #"+img)
    if(!def){
    Snap.load("img/"+img+".svg",function(data){
      if(data){
        if(data.node.nodeName != "svg"){
          data = data.select("svg")
        }
        var tGroup = Snap("#Map").g()
        tGroup.add(data)
        var tmpSVG = tGroup.select("svg")
        tmpSVG.attr({"id":img})
        tmpSVG.toDefs()
        tGroup.remove()
      }
    })}
    return def
  }

  function addElement(layer,img,x,y,action,singleUse){
    var tmpEle = Snap("#Map").g().attr({transform:"t"+x+" "+y}).g()
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
      tmpEle.click(tClick)
    }
    load(img)
    tmpEle.use("#"+img)
    return tmpEle.parent()
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
    load:load,
		addElement:addElement
	}
}])

// Game Core controller
/*
 * Manipulates the Game Data, consumes Game.Events, and contains the main game loop.
 */
Evotacle.controller("GameController",[
	"$scope",
	"$rootScope",
	"$interval",
	"Ressources",
	"Players",
	"MapView",
  "Resolveable",
	function($scope, $rootScope, $interval, Ressources, Players, MapView, Resolveable){
    $scope.Ressources = Ressources.Instances
    $scope.Player = new Players.Class()

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
      var tmpEle = MapView.addElement(null,"sym_tag_blank2",data.x,data.y)

      tmpEle.select("use").attr({
        x:-25,
        y:-50
      })

      if(data.hasOwnProperty("res")){
        MapView.load(data.res)
        tmpEle.select("g g").g({
          transform:"t 0,-32"
        }).circle({
          r:15,
          fill:"#647b70"
        }).use("#"+data.res).attr({
          href:"#"+data.res,
          height:30,
          width:30,
          x:-15,
          y:-15
        })
      }

      if(data.hasOwnProperty("duration")){
        tmpEle.node.setAttribute("data-duration",data.duration)
        var tmpHandler = function(){
          var current = parseInt( tmpEle.node.getAttribute("data-duration") )-1
          if(current == 0){
            window.document.removeEventListener("Window.Game.Step",this)
            tmpEle.remove()
          }else{
            tmpEle.node.setAttribute("data-duration",current)
          }
        }
        window.document.addEventListener("Window.Game.Step",tmpHandler)
      }

      tmpEle.hover(function(){
        this.select("g").animate({transform:"s1.2"},100)
      },function(){
        this.select("g").animate({transform:"s1"},100)
      }).singleClick(function(){
        this.remove()
        if(data.hasOwnProperty("resolve") && Resolveable.checkResolveable(data.resolve)){
          data.resolve.resolve()
        }
      })
    })

    $scope.calculateRessource = function(){
      $scope.Player.modRessource("Nutrients",1)
      var message = null
      if((Math.random() * 20).toFixed(0) == 0){
        $scope.Player.modRessource("Amino Acids",1)
        message = "Essential Amino Acids have been discovered by your tentacles."
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
        message = "An egg was spawned by your tentacles."
      }
      if(message != null){
        Snap("#Map").select("#EventTicker text").animate({
          opacity:0
        },100,function(){
          this.attr({
            text:message,
            opacity:1
          })

          var transform = this.select("animateTransform")

          //Clear Old Transforms
          if(transform){
            transform.remove()
          }

          var textElement = this

          var offset = (this.node.getBBox().width - this.parent().select("rect").node.getBBox().width)
          var timeFrame = offset/100

          if(offset > 0){
            offset += 20
            var SVGnamespace = "http://www.w3.org/2000/svg"
            var an = document.createElementNS(SVGnamespace,'animateTransform')

            an.setAttribute("attributeType","XML")
            an.setAttribute("attributeName","transform")
            an.setAttribute("type","translate")
            an.setAttribute("dur",`4s`)
            an.setAttribute("values",`${-offset/2} 0;${offset/2} 0;${-offset/2} 0`)
            an.setAttribute("repeatCount","indefinite")

            this.node.appendChild(an)
          }
        })
        Snap("#Map").select("#EventTicker rect").animate({
          fill:"#d58b23"
        },100,function(){
          this.animate({
            fill:"#483613"
          },500)
        })
      }
    }

    $scope.generateBubbles = function(){
      //$rootScope.$emit("Game.Popup",data)
    }

    // Main Game Loop - that updates ressources.
    $rootScope.$on("Game.Step",function(e){

      window.document.dispatchEvent(new CustomEvent("Window.Game.Step"))

      $scope.calculateRessource()
      //Generate Events
      $scope.generateBubbles()

      $scope.$digest()
    })

    $rootScope.$on("Player.Updated",function(e){
      $scope.$digest()
    })

  }
])

// Directive that controls the main loop of the game via Pause/Unpause Events.
Evotacle.directive("ngProgressEvent",['$rootScope',function($rootScope){
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
Evotacle.directive("ngClickHandle",['$rootScope',function($rootScope){
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
Evotacle.directive("ngReciever",['$rootScope',function($rootScope){
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


Evotacle.directive("ngDynamicStyles",['$rootScope',function($rootScope){

  // ngDynamicStyles="height,Y"
  // data-dy-height="pHeight-4vh"
  // data-dy-Y="4vh"
  // data-dy-height="{w|weight}"
  // data-dy-weight="12"

  var buildVariables = function(element){
    var parent = element.parentElement
    var variables = new Map()

    variables.set( "vh" , "*"+( Math.max( document.documentElement.clientHeight, window.innerHeight || 0) / 100 ) )
    variables.set( "vw" , "*"+( Math.max( document.documentElement.clientWidth,  window.innerWidth  || 0) / 100 ) )
    variables.set( /\{p\d+\|.+\}/, function(string){
      var depth = parseInt(string.substring(2,string.indexOf("|")))
      var evaluate = string.substring(string.indexOf("|")+1,string.length-1)
      return eval( "element."+( new Array(depth).fill("parentElement").join(".") )+"."+ evaluate )
    })
    variables.set( /\{w\|(.+)\}/, function(string){
      var target = string.substring(3,string.length-1)
      var targetString = "data-dy-"+target
      var elements = element.parentElement.children
        .filter((e)=>(e.hasAttribute(targetString)))
      var total = elements.map((e)=>parseInt(e.getAttribute(targetString))).reduce((a,b)=>a+b,0)
      return parseFloat( element.getAttribute(targetString) )/total
    })


    return variables
  }

  var calcDynamicStyle = function(ele,stylingString){
    var variables = buildVariables(ele)
    var tmpString = stylingString
    variables.forEach(function(v,k,m){
      tmpString = tmpString.replace(k,v)
    })
    return eval(tmpString)
  }


  var applyStyles = function(element){

    var dynamicStyles = element.getAttribute("ng-dynamic-styles").split(',')
    for(var style of dynamicStyles){
      var attributeString = "data-dy-"+style.toLowerCase()
      if(element.hasAttribute(attributeString)){
        element.setAttribute(style.toLowerCase(),eval(calcDynamicStyle(element,element.getAttribute(attributeString)).toFixed(2)))
      }
    }
  }

  var handleTimeout = null
  window.addEventListener("resize",function(){
    if(handleTimeout)
      clearTimeout(handleTimeout)
    handleTimeout = setTimeout(function () {
      $rootScope.$emit("DyStyles.Update")
    }, 70)
  })

  return {
    scope:false,
    link:function( $scope,element, attrs,controller,transcludeFn){
      var element = element[0]
      if(attrs.hasOwnProperty("ngDynamicStyles") && typeof attrs.ngDynamicStyles === "string"){
        applyStyles(element)
        $rootScope.$on("DyStyles.Update",function(e){
          applyStyles(element)
        })
      }else{
        console.log("Dynamic Style is of not supported format.")
      }
    }
  }
}])


// Controller containing the most basic game states: Running and Paused
// that also allows to manipulate the simulation speed..
Evotacle.controller("ViewController",["$scope","$rootScope",function($scope,$rootScope){
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
