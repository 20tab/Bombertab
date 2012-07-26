jQuery(function(){
	
	var BORDER_CELL = 0;
	var CELLS_NUMBER = 13;
	var CELL_W = 50;
	var CELL_H = CELL_W;
	var PG_W = (CELL_W+BORDER_CELL*2)*CELLS_NUMBER;
	var PG_H = (CELL_H+BORDER_CELL*2)*CELLS_NUMBER;
	var ACTOR_W = 50;
	var ACTOR_H = 70;
	var RATE = 30;
	
	var player_id = 0;
	var events = Array();
	
	function arena(grid){
		var html_grid = "" 
		var i = 0;
		var pos = 0;
		while( i < grid.length){
			html_grid += '<div class="grid-row">'; 
			var j = 0;
			while(j < CELLS_NUMBER){
				var type = "brick";
				if(!grid[pos]){
					type = "lawn";
				}
				html_grid += '<div class="grid-cell '+type+'"></div>';
				j++;
				pos++;
			}
			html_grid += '<div class="fixfloat"></div></div>' 
			i++;
		}
		return html_grid;
	}
	var playerAnimation = Array();
	$('#playground').playground({height: PG_H, width: PG_W, keyTracker: true})
	function init_arena(player_id,pos_x,pos_y,enemies){
		
		$.playground().addSprite('grid',{height: PG_H, width: PG_W}).end();
		
		playerAnimation["idle"] = 	new $.gameQuery.Animation({imageURL: "img/er_king_fl.png",
																type: $.gameQuery.ANIMATION_HORIZONTAL});
	    playerAnimation["up"] = 	new $.gameQuery.Animation({imageURL: "img/er_king_bl.png"});
	    playerAnimation["down"] = 	new $.gameQuery.Animation({imageURL: "img/er_king_fl.png"});
	    playerAnimation["right"] = 	new $.gameQuery.Animation({imageURL: "img/er_king_rl.png"});
	    playerAnimation["left"] =	new $.gameQuery.Animation({imageURL: "img/er_king_ll.png"});
        
		$.playground().addGroup("actors", {width: PG_W, height: PG_H}).end()
                .addGroup("player_"+player_id, {posx: pos_x, posy: pos_y,
                      width: ACTOR_W, height: ACTOR_H})
                  .addSprite("playerBody_"+player_id,{animation: playerAnimation["idle"],
                      posx: 0, posy: 0, width: ACTOR_W, height: ACTOR_H});
        //$("#player_"+player_id).html($("#player_"+player_id).html()+"<span>"+player_id+"</span>");
        
        for(i in enemies){
        	$.playground().addGroup("player_"+enemies[i][0], {posx: enemies[i][1], posy: enemies[i][2],
                      width: ACTOR_W, height: ACTOR_H})
                  .addSprite("playerBody_"+enemies[i][0],{animation: playerAnimation["idle"],
                      posx: 0, posy: 0, width: ACTOR_W, height: ACTOR_H});
           //$("#player_"+enemies[i][0]).html($("#player_"+enemies[i][0]).html()+enemies[i][0]);  
        }

	
		$(document).keydown(function(e){
          switch(e.keyCode){
            case 65: //this is left! (a)
              $("#playerBody_"+player_id).setAnimation(playerAnimation["left"]);
              break;
            case 87: //this is up! (w)
              $("#playerBody_"+player_id).setAnimation(playerAnimation["up"]);
              break;
            case 68: //this is right (d)
              $("#playerBody_"+player_id).setAnimation(playerAnimation["right"]);
              break;
                case 83: //this is down! (s)
              $("#playerBody_"+player_id).setAnimation(playerAnimation["down"]);
              break;
          }
        });
        //this is where the keybinding occurs
        $(document).keyup(function(e){
          switch(e.keyCode){
            case 65: //this is left! (a)
              $("#playerBody_"+player_id).setAnimation(playerAnimation["left"]);
              break;
            case 87: //this is up! (w)
              $("#playerBody_"+player_id).setAnimation(playerAnimation["up"]);
              break;
            case 68: //this is right (d)
              $("#playerBody_"+player_id).setAnimation(playerAnimation["right"]);
              break;
            case 83: //this is down! (s)
              $("#playerBody_"+player_id).setAnimation(playerAnimation["down"]);
              break;
          }
        });
		
        $.playground().registerCallback(eventsManager, RATE);
        
	}
	
	if (!"WebSocket" in window) {
		alert("WebSockets are not supported by your Browser!");
	}
	
	var ws;
	

	
	
	
	
	
	function eventsManager(){
	
		//$("#player")[0].player.update();
		if(jQuery.gameQuery.keyTracker[65]){ //this is left! (a)
			var message = {'c':'w','p':player_id};
			ws.send(JSON.stringify(message));
			/*var nextpos = parseInt($("#player").css("left"))-5;
			if(nextpos > 0){
				$("#player").css("left", ""+nextpos+"px");
    		}*/
    	}
    	else if(jQuery.gameQuery.keyTracker[68]){ //this is right! (d)
			var message = {'c':'e','p':player_id};
			ws.send(JSON.stringify(message));
			/*var nextpos = parseInt($("#player").css("left"))+5;
			if(nextpos < PG_W - ACTOR_W){
				$("#player").css("left", ""+nextpos+"px");
			}*/
		}
		else if(jQuery.gameQuery.keyTracker[87]){ //this is up! (w)
			var message = {'c':'n','p':player_id};
			ws.send(JSON.stringify(message));
			/*var nextpos = parseInt($("#player").css("top"))-3;
			if(nextpos > -30){
				$("#player").css("top", ""+nextpos+"px");
			}*/
		}
		else if(jQuery.gameQuery.keyTracker[83]){ //this is down! (s)
			var message = {'c':'s','p':player_id};
			ws.send(JSON.stringify(message));
			/*var nextpos = parseInt($("#player").css("top"))+3;
			if(nextpos < PG_H - ACTOR_H){
			  	$("#player").css("top", ""+nextpos+"px");
			}*/
		}
		while((e = events.pop()) != null){
			$("#player_"+e[0]).css("left", ""+e[1]+"px");
			$("#player_"+e[0]).css("top", ""+e[2]+"px");
		}
	}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	$('#startGame').on('click',function(){
		$.playground().startGame(function(){
			
			ws = new WebSocket("ws://quantal64.local:8080/bombertab");
			ws.onopen = function() {
			        ws.send('{"c":"j"}');
			};
			ws.onmessage = function(evt) { 
			    var msg = jQuery.parseJSON(evt.data);
				switch(msg['c']){
					case "z":
				        player_id = msg['p'];
				        init_arena(player_id,msg['x'],msg['y'],msg['e']);
				        $("#grid").html(arena(msg['a']));
				        break;
				    case "m":
				    	events.push([msg['p'],msg['x'],msg['y']]);
				    	break;
				    case "p":
				    	$.playground().addGroup("player_"+msg['p'], {posx: msg['x'], posy: msg['y'],
			                      width: ACTOR_W, height: ACTOR_H})
			                  .addSprite("playerBody_"+msg['p'],{animation: playerAnimation["idle"],
		                      posx: 0, posy: 0, width: ACTOR_W, height: ACTOR_H});
		                //$("#player_"+msg['p']).html($("#player_"+msg['p']).html()+msg['p']);
		                break;
		            case "k":
		            	$("#player_"+msg['p']).remove();
				    default:
				    	break;
				}
			        
			};
			ws.onclose = function() {
				alert("Connection is closed..."); 
			};
			
		});
	});
	
});



