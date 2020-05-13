package main

import (
	"encoding/json"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"

	vibrant "github.com/RobCherry/vibrant"
)

// ColorItem ...
type ColorItem struct {
	VibrantName string `json:"vibrant_name"`
	Hex         string `json:"hex"`
}

func main() {
	filename, err := filepath.Abs(os.Args[1])
	// log.Println(filename)
	if err != nil {
		log.Panic(err)
	}
	file, _ := os.Open(filename)
	defer file.Close()
	decodedImage, _, err := image.Decode(file)
	// log.Println(arg)
	if err != nil {
		log.Panic(err)
	}
	palette := vibrant.NewPaletteBuilder(decodedImage).Generate()
	// Iterate over the swatches in the palette...
	// for _, swatch := range palette.Swatches() {
	// 	log.Printf("Swatch has color %v and population %d\n", swatch.RGBAInt(), swatch.Population())
	// }

	colors := []ColorItem{}

	d := palette.VibrantSwatch()
	if d != nil {
		c := ColorItem{VibrantName: "Vibrant", Hex: cssHex(d.RGBAInt())}
		colors = append(colors, c)
	}
	d = palette.DarkVibrantSwatch()
	if d != nil {
		c := ColorItem{VibrantName: "DarkVibrant", Hex: cssHex(d.RGBAInt())}
		colors = append(colors, c)
	}
	d = palette.LightVibrantSwatch()
	if d != nil {
		c := ColorItem{VibrantName: "LightVibrant", Hex: cssHex(d.RGBAInt())}
		colors = append(colors, c)
	}
	d = palette.MutedSwatch()
	if d != nil {
		c := ColorItem{VibrantName: "Muted", Hex: cssHex(d.RGBAInt())}
		colors = append(colors, c)
	}
	d = palette.LightMutedSwatch()
	if d != nil {
		c := ColorItem{VibrantName: "LightMuted", Hex: cssHex(d.RGBAInt())}
		colors = append(colors, c)
	}
	d = palette.DarkMutedSwatch()
	if d != nil {
		c := ColorItem{VibrantName: "DarkMutedSwatch", Hex: cssHex(d.RGBAInt())}
		colors = append(colors, c)
	}

	data, err := json.MarshalIndent(colors, "", "")
	if err != nil {
		log.Panic(err)
	}
	fmt.Println(string(data))
	// SaveToJSON(colors, "out.json")
}

// SaveToJSON ...
func SaveToJSON(data interface{}, dest string) error {
	file, err := json.MarshalIndent(data, "", " ")
	if err != nil {
		return err
	}

	err = ioutil.WriteFile(dest, file, 0644)
	return err
}

func cssHex(hex vibrant.RGBAInt) string {
	// it is of the form 0xaarrggbb
	str := hex.String()
	rgb := str[4:]
	// a := str[2:4]
	return ("#" + rgb)
	// return ("#" + rgb + a)
}
