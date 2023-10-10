$top_width = 11.5;
$top_height = 9.1;
$top_depth = 5.3;


module buttonBase(){
    
        hull(){
    difference(){
      cube([$top_width - 1, $top_height - 1, $top_depth - 1], center = true);
      translate([-($top_height - 1) / 2, -($top_height - 1) / 2 , 0])
      cube([$top_height - 1, $top_height - 1, $top_depth - 1], center = true);
    }
    translate([-($top_width - $top_height) / 2,0,0])
    cylinder(h = $top_depth - 1, r = ($top_height - 1) / 2, center = true, $fn=24);
    }
}

module buttonTop(){
  $roundness = 1.5;
  minkowski(){
    buttonBase();
    hull(){
      sphere(r=$roundness, $fn=24);
      translate([-($roundness / 2),-($roundness / 2),-($roundness / 2)])
        cube($roundness, center = true);
    }
  }
}

module cutouts(){
    minkowski(){
      translate([0.5,0,0])
        rotate([0,180,0])
          cylinder(h = 2, r = 1.75, center = true, $fn=3);
    sphere(r=0.5, $fn=24);
    }
}

difference(){
    union(){
buttonTop();
translate([0,0,-4])
  buttonBase();
    }
translate([0,0,4])
cutouts();
}