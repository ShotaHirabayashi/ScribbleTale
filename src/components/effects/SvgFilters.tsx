export function SvgFilters() {
  return (
    <svg className="absolute h-0 w-0" aria-hidden="true">
      <defs>
        {/* Paper texture filter */}
        <filter id="paper-texture" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.04"
            numOctaves="5"
            seed="2"
            result="noise"
          />
          <feDiffuseLighting
            in="noise"
            lightingColor="#f5e6d3"
            surfaceScale="1.5"
            result="light"
          >
            <feDistantLight azimuth="45" elevation="60" />
          </feDiffuseLighting>
          <feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" />
        </filter>

        {/* Watercolor dissolve filter */}
        <filter id="watercolor-dissolve" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.015"
            numOctaves="3"
            seed="5"
            result="turbulence"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="turbulence"
            scale="12"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Soft vignette for page edges */}
        <filter id="vignette" x="-5%" y="-5%" width="110%" height="110%">
          <feFlood floodColor="#8b7355" floodOpacity="0.08" result="flood" />
          <feComposite in="flood" in2="SourceGraphic" operator="in" result="comp" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="comp" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}
