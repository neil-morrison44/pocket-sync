$depth = 11.17;
$thickness = 1.75;

$bottom_radius = 6.3;
$top_radius = 1;

$width = 88.7;
$height = 149.99;

$screen_height = 78.88;
$screen_width = 85.42;
$screen_inset = ($width - $screen_width) / 2;

$dpad_width = 7.2;
$dad_length = 6.8;

$dpad_span = ($dad_length * 2) + $dpad_width;

$face_button_radius = 8.4 / 2;
$start_button_radius = 5 / 2;

$side_button_radius = 5.4 / 2;

module base(inset = 0) {
  hull(){
  $bottom_x = (($width / 2) - ($bottom_radius)) - inset;
  $bottom_y = (($height / 2) - ($bottom_radius)) - inset;

  $fn = 36;

  for(x = [-$bottom_x, $bottom_x])
  translate([x, -$bottom_y, inset])
    cylinder($depth,r1= $bottom_radius - 0.25, r2=$bottom_radius);

  $top_x = (($width / 2) - ($top_radius)) - inset;
  $top_y = (($height / 2) - ($top_radius)) - inset;


  for (x = [-$top_x, $top_x])
  translate([-x, $top_y, inset])
    cylinder($depth,r1= $top_radius - 0.25, r2 = $top_radius);
  }

}

module cutouts(){
    //DPAD

    translate([24.5, -26, 0])
    minkowski(){
        union(){
    cube([$dpad_width, $dpad_span, 10], true);
    cube([$dpad_span, $dpad_width, 10], true);
        }
        sphere(1, $fn = 12);
    }

    // A B X Y
    translate([-24.5, -26, 0])
    for (angle = [0, 90, 180, 270]){
        translate([sin(angle) * 8.8, cos(angle) * 8.8, 0])
        cylinder(h=10, r=$face_button_radius + 0.25, center = true);
    }


    // Start, Home, Select

    translate([0, -($height / 2) + 15.5, 0]){
        for (x = [-8.8, 0, 8.8]){
            translate([x, 0, 0])
            cylinder(h=10, r=$start_button_radius + 0.25, center = true, $fn=12);
        }

    }

    // Volume, Power

    translate([$width/2, (($height / 2)) - 34.6, ($depth / 2)])
      rotate([0,90,0]){
        hull(){
        cylinder(h=$width, r=$side_button_radius, center = true, $fn=24);
        translate([0,-3,0])
          cylinder(h=$width, r=$side_button_radius, center = true, $fn=24);
      }

       translate([0, -12])
         hull(){
        cylinder(h=$width, r=$side_button_radius, center = true, $fn=24);
        translate([0,-4,0])
          cylinder(h=$width, r=$side_button_radius, center = true, $fn=24);
      }

    }

    // SD card

     translate([-$width/2, (($height / 2)) - 41.5, ($depth / 2)])
      rotate([0,90,0]){
        cube([2.8, 13.1, 10], center = true);
    }

    // speakers
    translate([0, (($height / 2)) - 6.5, ($depth / 2)])
    rotate([0,90,0])
    for (i = [0:7])
        translate([0,i*-3,0])
          cylinder(h=$width * 2, r=1, center = true, $fn=12);


    // bottom plugs
    translate([0, ((-$height / 2)), ($depth / 2)])
      rotate([90,0,0]){
        // USB C
          hull(){
            for (i = [-4.5,4.5])
                translate([i, 0, 0])
                    cylinder(h=5, r=1.5, center = true, $fn=12);

          }

          // headphone
          translate([-24,0,0])
            cylinder(h=$width * 2, r=2, center = true, $fn=12);

          // link cable
          translate([16, ($depth / 2), -5])
            cube([10.5,4.5,10.1], center=true);
      }

    // cartridge shoot
    translate([0, (($height / 2)), ($depth / 2)])
      rotate([90,0,0]){
        translate([0,($depth / 2),0])
        hull(){
          cube([64,0.1,10], center=true);
          cube([58,2.8,10], center=true);
        }
      }
}

module innerStruts(){
    // DPAD
    translate([24.5, -26, 0])
    difference(){
    cylinder(h=4, r=$dpad_span / 1.4);
        translate([0,0,1.6])
        cylinder(h=4, r=$dpad_span / 1.5);
    }

    // face_butons
    translate([-24.5, -26, 2])
    difference(){
        cube([9.4*2, 9.4*2, 3], center = true);
        translate([0,0,1.1])
        cube([8.2*2, 8.2*2, 3], center = true);
    }

    // Start, Home, Select

    translate([0, -($height / 2) + 15.5, 0]){
        hull(){
        for (x = [-8.8, 0, 8.8]){
            translate([x, 0, 2.1])
            cylinder(h=4, r=$start_button_radius + 1.4, center = true, $fn=12);
        }
    }

    }

    // Wall Struts

    translate([0, ((-$height / 2)) + 10, ($depth / 2)])
      rotate([90,0,0]){
          translate([-($width/2) + 4.4, -2,0])
          for (i = [0:20:100])
              translate([0,0,-i])
          cube([5, 5, 1], center = true);

          translate([($width/2) - 4.4, -2,0])
          for (i = [0:20:100])
              translate([0,0,-i])
          cube([5, 5, 1], center = true);
      }

    // Center Strut

    translate([0,-32,2.1])
     cylinder(h=4, r=1.5, center = true, $fn=24);
}

module screen(){
    translate([0,($height / 2) - $screen_inset - ($screen_height /2),0])
    color([0,0,1])
    minkowski(){
    cube([$screen_width-1, $screen_height-1, 0.1], true);
        cylinder(h=0.1, r=1, center=true, $fn=36);
    }
}

difference(){
    union(){
difference(){
  base();
  base($thickness);
}
innerStruts();
}
  cutouts();
}

screen();
