$thickness = 1.75;
$depth = 2;

$bottom_radius = 6.3;
$top_radius = 1;

$width = 88.7;
$height = 149.99;

$bump_depth = 11.2;
$bump_height = 93.4;

$shoot_outer = 64;
$shoot_inner = 58;


module base(){
  $bottom_x = (($width / 2) - ($bottom_radius)) - $thickness;
  $bottom_y = (($height / 2) - ($bottom_radius)) - $thickness;

  $fn = 36;
  hull(){
  for(x = [-$bottom_x, $bottom_x])
  translate([x, -$bottom_y, $thickness])
    cylinder($depth + $thickness,r1= $bottom_radius, r2=$bottom_radius);

  $top_x = (($width / 2) - ($top_radius)) - $thickness;
  $top_y = (($height / 2) - ($top_radius)) - $thickness;


  for (x = [-$top_x, $top_x])
  translate([-x, $top_y, $thickness])
    cylinder($depth + $thickness,r1= $top_radius, r2 = $top_radius);
  }
}

module bump(){
    $fn=36;
    $start_y = (-$height / 2)  + $thickness;
    
    $bump_sphere_depth = 2.2;
    $bump_cylin_depth = $bump_depth - $bump_sphere_depth;
    
    hull(){
        
    translate([(-$width/2) + $thickness, $start_y,0]){
        translate([$bottom_radius, $bottom_radius, 0]){
    cylinder(h=$bump_cylin_depth, r=$bottom_radius, center=true);
    translate([0,0,(-$bump_cylin_depth / 2)])
      sphere(r=$bottom_radius);
        }
    }
    
        translate([($width/2) - $thickness, $start_y,0]){
        translate([-$bottom_radius, $bottom_radius, 0]){
    cylinder(h=$bump_cylin_depth, r=$bottom_radius, center=true);
    translate([0,0,(-$bump_cylin_depth / 2)])
      sphere(r=$bottom_radius);
        }
    }
    
    $end_y = ($start_y + $bump_height) - ($bottom_radius * 2) - 2;
    
    
    translate([(-$width/2) + $thickness, $end_y,0]){
        translate([$bottom_radius, $bottom_radius, 0]){
    cylinder(h=$bump_cylin_depth, r=$bottom_radius, center=true);
    translate([0,0,(-$bump_cylin_depth / 2)]){
      sphere(r=$bottom_radius);
      translate([0,$bottom_radius - 2,-$bottom_radius + 2])
        sphere(r=2.2);
        }
    }
    }
    
    translate([($width/2) - $thickness, $end_y,0]){
        translate([-$bottom_radius, $bottom_radius, 0]){
    cylinder(h=$bump_cylin_depth, r=$bottom_radius, center=true);
    translate([0,0,(-$bump_cylin_depth / 2)]){
      sphere(r=$bottom_radius);
      translate([0,$bottom_radius - 2,-$bottom_radius + 2])
        sphere(r=$bump_sphere_depth);
    }
        }
     
    }
    
}
}

module cutouts(){
    // cartridge shoot
    $shoot_height = $height - $bump_height;
    translate([0,$height / 2, 1])
      rotate([90,0,0]){
        translate([0,($depth / 2) - 0.25,0])
        hull(){
          cube([$shoot_inner, 2.8,($shoot_height * 2)], center=true);
          translate([0,-4,0])
          cube([$shoot_outer,8,($shoot_height * 2)], center=true);
        }
      }
    // cartridge slot
      
    translate([0,$height / 2, 1])
      rotate([90,0,0]){
        translate([0,-7.2,0])
        hull(){
          cube([$shoot_inner - 8, 2.8,($shoot_height * 2.4)], center=true);
          translate([0,4,0])
          cube([$shoot_outer - 8,8,($shoot_height * 2.4)], center=true);
        }
      }
      
    // ridges
    translate([0,-12, -$bump_depth])
    rotate([0,90,0])
      for(i = [0:4.2:45])
        translate([0,-i,0])
          cylinder(h = $width, r=0.5, center = true, $fn=12);
      
    // screws
    translate([0,-4,-15])
      for(x = [-(($width / 2) - 14), (($width / 2) - 14)])
          translate([x, 0, 0])
            cylinder(h=20, r=3, center=true);
     
    translate([0,-62,-15])
      for(x = [-(($width / 2) - 14), (($width / 2) - 14)])
          translate([x, 0, 0])
            cylinder(h=20, r=3, center=true);
      
    
    // trigger holes
    
    translate([0,14.75,-5.8])
      for(x = [-(($width / 2) - 6), (($width / 2) - 6)])
          translate([x, 0, 0])
            minkowski(){
              cube([(($width - $shoot_inner) / 2),7,12], center=true);
              sphere(r=1, $fn = 24);
            }
}

difference(){
  union(){
    base();
    difference(){
      bump();
      difference(){
        scale([0.97,0.95,0.9])
          bump();
        union(){
        translate([0,8,-2])
          cube([$width,36,20], center=true);
        translate([0,-70,-2])
          cube([$width,26,20], center=true);
        }
      }
    }
  }
  cutouts();
}
