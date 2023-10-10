$face_button_radius = 8.4 / 2;
$button_depth = 9;


module button(){
  hull(){
  cylinder(h=$button_depth, r = $face_button_radius, center= true, $fn=24);
  translate([0,0,($button_depth / 2)])
    scale([1,1,0.2])
      sphere(r=$face_button_radius, $fn=24);
  }
}


button();
