import numpy as np
import math

class DriftEngine:
    def __init__(self, alpha=0.03, coriolis_angle=15):
        """
        Initialize the Lagrangian drift engine.
        :param alpha: Windage coefficient (typically 3% of wind speed)
        :param coriolis_angle: Deflection angle in degrees due to Coriolis effect
        """
        self.alpha = alpha
        self.theta = math.radians(coriolis_angle)
        
        # Rotation matrix for wind deflection
        self.R = np.array([
            [np.cos(self.theta), -np.sin(self.theta)],
            [np.sin(self.theta),  np.cos(self.theta)]
        ])

    def get_metocean_data(self, lat, lon, time):
        """
        Mock metocean data retrieval (Currents U, V and Wind U, V)
        Returns: current_vector, wind_vector
        """
        # Static mock fields for testing
        u_current = -0.1
        v_current = -0.05
        u_wind = -2.0
        v_wind = -1.0
        
        return np.array([u_current, v_current]), np.array([u_wind, v_wind])

    def rk4_step(self, particles, dt, time):
        """
        4th order Runge-Kutta integrator for particle advection
        :param particles: Nx2 array of (lon, lat)
        :param dt: Time step in seconds (negative for hindcast)
        """
        # For simplicity in this mock, we assume uniform velocity field
        # In reality, interpolate from raster grids at each particle position
        
        def velocity(p, t):
            curr, wind = self.get_metocean_data(p[:, 1], p[:, 0], t)
            # Drift = Current + alpha * R * Wind
            wind_deflected = self.R.dot(wind)
            drift = curr + self.alpha * wind_deflected
            
            # Convert m/s to degrees/sec (approximate)
            # 1 degree lat = 111,320 m
            d_lat = drift[1] / 111320.0
            d_lon = drift[0] / (111320.0 * np.cos(np.radians(p[:, 1].mean())))
            return np.column_stack((d_lon, d_lat))
            
        k1 = velocity(particles, time)
        k2 = velocity(particles + 0.5 * dt * k1, time + 0.5 * dt)
        k3 = velocity(particles + 0.5 * dt * k2, time + 0.5 * dt)
        k4 = velocity(particles + dt * k3, time + dt)
        
        return particles + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)

    def hindcast(self, start_polygon, num_particles=500, hours=36, dt_minutes=30):
        """
        Run backward simulation
        """
        # Initialize particles uniformly within bounding box for mock
        min_lon, min_lat, max_lon, max_lat = start_polygon.bounds
        particles = np.column_stack((
            np.random.uniform(min_lon, max_lon, num_particles),
            np.random.uniform(min_lat, max_lat, num_particles)
        ))
        
        dt_seconds = -dt_minutes * 60 # Negative for hindcast
        steps = int(hours * 60 / dt_minutes)
        
        history = [particles.copy()]
        
        current_time = 0 # Relative time
        
        for _ in range(steps):
            # Advection
            particles = self.rk4_step(particles, dt_seconds, current_time)
            
            # Diffusion (Monte Carlo random walk)
            # D_h = 10 m^2/s
            diffusion_scale = np.sqrt(2 * 10 * abs(dt_seconds)) / 111320.0
            diffusion = np.random.normal(0, diffusion_scale, particles.shape)
            particles += diffusion
            
            history.append(particles.copy())
            current_time += dt_seconds
            
        return history

    def forecast(self, start_polygon, num_particles=500, hours=24, dt_minutes=30):
        """
        Run forward simulation to predict future flow of the slick.
        This uses positive time steps.
        """
        # Initialize particles uniformly within bounding box for mock
        min_lon, min_lat, max_lon, max_lat = start_polygon.bounds
        particles = np.column_stack((
            np.random.uniform(min_lon, max_lon, num_particles),
            np.random.uniform(min_lat, max_lat, num_particles)
        ))
        
        dt_seconds = dt_minutes * 60 # Positive for forecast
        steps = int(hours * 60 / dt_minutes)
        
        future_path = [particles.copy()]
        current_time = 0 
        
        for _ in range(steps):
            particles = self.rk4_step(particles, dt_seconds, current_time)
            
            diffusion_scale = np.sqrt(2 * 10 * dt_seconds) / 111320.0
            diffusion = np.random.normal(0, diffusion_scale, particles.shape)
            particles += diffusion
            
            future_path.append(particles.copy())
            current_time += dt_seconds
            
        return future_path
