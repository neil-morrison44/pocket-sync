$side_button_radius = 5.4 / 2;
$button_depth = 6;


hull(){
cylinder(h=$button_depth, r=$side_button_radius - 0.1, center = true, $fn=24);
  translate([0,-4,0])
    cylinder(h=$button_depth, r=$side_button_radius - 0.1, center = true, $fn=24);
}
