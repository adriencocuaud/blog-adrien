MaVoiture = {}
  MaVoiture.x = 0
  MaVoiture.y = 520
  MaVoiture.direction = 'right'
  MaVoiture.image_left = love.graphics.newImage('voiture2.png')
  MaVoiture.image_right = love.graphics.newImage('voiture.png')
  MaVoiture.width , MaVoiture.height = MaVoiture.image_left:getDimensions( )

  Plateforme = {}
  Plateforme.x = 0
  Plateforme.y = 0
  Plateforme.image = love.graphics.newImage('Plateforme.png')
  Plateforme.width , Plateforme.height = Plateforme.image:getDimensions( )

  Alien = {}
  Alien.x = 0
  Alien.y = 50
  Alien.vitesse = 5 
  Alien.image = love.graphics.newImage('alien.png')
  
  Background = {}
  Background.image = love.graphics.newImage('Background.png')
  Background.width , Background.height = Background.image:getDimensions( )
   
  LaserNumber = 1
  function LaserShot()
    Laser = {}
    Laser.x= Alien.x
    Laser.y= 110
    Laser.vitesse = 5 + LaserNumber
    Laser.image = love.graphics.newImage('laser.png')
    Laser.width , Laser.height = Laser.image:getDimensions( )
    LaserNumber = LaserNumber + 1
  end
  LaserShot()
  
  
  function checkCollision()
    if Laser.y + Laser.height > MaVoiture.y then
      if Laser.y < MaVoiture.y + MaVoiture.height then
        if Laser.x + Laser.width > MaVoiture.x  then
          if Laser.x < MaVoiture.x + MaVoiture.width  then return true
          end
        end
      end
    end  
  end
  
  function love.draw()
    love.graphics.draw(Background.image )
    love.graphics.draw(Laser.image, Laser.x, Laser.y)
    if MaVoiture.direction == 'right' then
      love.graphics.draw(MaVoiture.image_right, MaVoiture.x, MaVoiture.y)
    end
    if MaVoiture.direction == 'left' then
      love.graphics.draw(MaVoiture.image_left, MaVoiture.x, MaVoiture.y)
    end
    love.graphics.draw(Alien.image, Alien.x, Alien.y)
  end
  
  function love.update()
    if checkCollision() then
      love.event.quit('restart')
   end
    if love.keyboard.isDown('right') then
    MaVoiture.direction = 'right'
    end
    if love.keyboard.isDown('left') then
      MaVoiture.direction = 'left'
    end
   if love.keyboard.isDown('right') then
      MaVoiture.x = MaVoiture.x + 5
   end
   if love.keyboard.isDown('left') then
      MaVoiture.x = MaVoiture.x - 5
   end
   if MaVoiture.x < 0 then 
     MaVoiture.x = MaVoiture.x + 5
   end
   if MaVoiture.x > 575 then
     MaVoiture.x = MaVoiture.x - 5
   end
   Alien.x = Alien.x + Alien.vitesse
   
   if Alien.x > 700 then
    Alien.vitesse = -5
   end
  
   if Alien.x < 0 then
    Alien.vitesse = 5
    end
    Laser.y = Laser.y + Laser.vitesse
    
    if Laser.y > 550 then 
    LaserShot()
    end

  end
  
