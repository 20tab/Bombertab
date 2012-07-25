jQuery(function(){
	
	var PG_W = 864;
	var PG_H = 864;
	
	$('#playground').playground({height: PG_H, width: PG_W, keyTracker: true})
	.addSprite('grid',{height: PG_H, width: PG_W}).end();
	
	
	var GRID = [[1,1,1,1,1,1,0,1,1,1,0,1],
				[0,1,0,1,1,0,1,1,0,1,0,1],
				[1,1,1,0,1,1,1,0,0,1,1,1],
				[0,1,1,1,0,1,1,0,1,1,1,0],
				[1,1,1,1,1,1,0,1,1,1,0,1],
				[0,1,0,1,1,0,1,1,0,1,0,1],
				[1,1,1,0,1,1,1,0,0,1,1,1],
				[0,1,1,1,0,0,1,0,1,1,1,0],
				[1,1,1,1,1,1,0,1,1,1,0,1],
				[0,1,0,1,1,0,1,1,0,1,0,1],
				[1,1,1,0,1,1,1,0,0,1,1,1],
				[0,1,1,1,0,1,1,0,1,1,1,0],
				];
	
	function grid(grid){
		var html_grid = "" 
		for( i in grid){
			html_grid += '<div class="grid-row">'; 
			for(j in grid[i]){
				var type = "brick";
				if(grid[i][j]){
					type = "lawn";
				}
				html_grid += '<div class="grid-cell '+type+'"></div>';
			}
			html_grid += '<div class="fixfloat"></div></div>' 
		}
		return html_grid;
	}
	
	$("#grid").html(grid(GRID));
	
	
	$.playground().addGroup('emperor',{height: PG_H, width: PG_W}).end();
	
	
	var playerAnimation = Array();
	playerAnimation["idle"] = 	new $.gameQuery.Animation({imageURL: "img/er_king_fl.png"});
    playerAnimation["up"] = 	new $.gameQuery.Animation({imageURL: "img/er_king_bl.png"});
    playerAnimation["down"] = 	new $.gameQuery.Animation({imageURL: "img/er_king_fl.png"});
    playerAnimation["right"] = 	new $.gameQuery.Animation({imageURL: "img/er_king_rl.png"});
    playerAnimation["left"] =	new $.gameQuery.Animation({imageURL: "img/er_king_ll.png"});
	
	$.playground().addGroup("actors", {width: PG_W, height: PG_H})
                .addGroup("player", {posx: 0, posy: 0,
                      width: 60, height: 80})
                  .addSprite("playerBody",{animation: playerAnimation["idle"],
                      posx: 0, posy: 0, width: 60, height: 80});
	
	
	$(document).keydown(function(e){
          switch(e.keyCode){
            case 65: //this is left! (a)
              $("#playerBody").setAnimation(playerAnimation["left"]);
              break;
            case 87: //this is up! (w)
              $("#playerBody").setAnimation(playerAnimation["up"]);
              break;
            case 68: //this is right (d)
              $("#playerBody").setAnimation(playerAnimation["right"]);
              break;
                case 83: //this is down! (s)
              $("#playerBody").setAnimation(playerAnimation["down"]);
              break;
          }
        });
        //this is where the keybinding occurs
        $(document).keyup(function(e){
          switch(e.keyCode){
            case 65: //this is left! (a)
              $("#playerBody").setAnimation(playerAnimation["left"]);
              break;
            case 87: //this is up! (w)
              $("#playerBody").setAnimation(playerAnimation["up"]);
              break;
            case 68: //this is right (d)
              $("#playerBody").setAnimation(playerAnimation["right"]);
              break;
            case 83: //this is down! (s)
              $("#playerBody").setAnimation(playerAnimation["down"]);
              break;
          }
        });
	
	
	$.playground().registerCallback(function(){
		//$("#player")[0].player.update();
		if(jQuery.gameQuery.keyTracker[65]){ //this is left! (a)
			var nextpos = parseInt($("#player").css("left"))-5;
			if(nextpos > 0){
				$("#player").css("left", ""+nextpos+"px");
    		}
    	}
    	if(jQuery.gameQuery.keyTracker[68]){ //this is right! (d)
			var nextpos = parseInt($("#player").css("left"))+5;
			if(nextpos < PG_W - 60){
				$("#player").css("left", ""+nextpos+"px");
			}
		}
		if(jQuery.gameQuery.keyTracker[87]){ //this is up! (w)
			var nextpos = parseInt($("#player").css("top"))-3;
			if(nextpos > 0){
				$("#player").css("top", ""+nextpos+"px");
			}
		}
		if(jQuery.gameQuery.keyTracker[83]){ //this is down! (s)
			var nextpos = parseInt($("#player").css("top"))+3;
			if(nextpos < PG_H - 80){
			  	$("#player").css("top", ""+nextpos+"px");
			}
		}
	}, 30);
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	$('#startGame').on('click',function(){
		$.playground().startGame(function(){
		});
	});
	
});



