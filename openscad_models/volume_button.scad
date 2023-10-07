$side_button_radius = 5.4 / 2;
$button_depth = 6;

$full_length = ($side_button_radius * 2) + 3;
$cut_radius = 0.15;

module cutouts(){
  rotate([0, 90, 0]){
    cylinder(h = 10, r = 0.2, $fn = 12, center=true);

    translate([0,-($full_length / 4),0])
      cylinder(h = $side_button_radius / 1.2, r = $cut_radius, $fn = 12, center=true);

    translate([0,($full_length / 4),0]){
      cylinder(h = $side_button_radius / 1.2, r = $cut_radius, $fn = 12, center=true);
      rotate([90, 0, 0])
        cylinder(h = $side_button_radius / 1.2, r = $cut_radius, $fn = 12, center=true);
    }
  }
}

difference(){
hull(){
  cylinder(h=$button_depth, r=$side_button_radius, center = true, $fn=24);
    translate([0,-3,0])
      cylinder(h=$button_depth, r=$side_button_radius, center = true, $fn=24);
}

translate([0,-1.5, ($button_depth / 2)])
  cutouts();
}
