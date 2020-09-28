/*******************************************************************
DECLARE @output INT = 0
		,@fieldName	nvarchar(255)
		,@syncDate	DATETIME
EXEC [dbo].[EntityStatistics_Get]
	 @guid				= '2D442AEA-E58B-4E8E-B09B-5602E1AA545A'	
	,@invokingUser  	= '7D31E738-5E24-4EA2-AAEF-47BB0F3CCD41'
	,@version			= 'v1'
	,@output			= @output		OUTPUT
	,@fieldName			= @fieldName	OUTPUT
	,@syncDate		= @syncDate		OUTPUT
               
 SELECT @output status,  @fieldName AS fieldName, @syncDate syncDate    
 
001	SEM-4 01-07-2020 [Nishit Khakhi]	Added Initial Version to Get Entity Statistics
*******************************************************************/

CREATE PROCEDURE [dbo].[EntityStatistics_Get]
(	 @guid				UNIQUEIDENTIFIER	
	,@invokingUser		UNIQUEIDENTIFIER	= NULL
	,@version			NVARCHAR(10)
	,@output			SMALLINT		  OUTPUT
	,@fieldName			NVARCHAR(255)	  OUTPUT
	,@syncDate			DATETIME			OUTPUT
	,@culture			NVARCHAR(10)	  = 'en-Us'
	,@enableDebugInfo	CHAR(1)			  = '0'
)
AS
BEGIN
    SET NOCOUNT ON
	IF (@enableDebugInfo = 1)
	BEGIN
        DECLARE @Param XML
        SELECT @Param =
        (
            SELECT 'EntityStatistics_Get' AS '@procName'
			, CONVERT(nvarchar(MAX),@guid) AS '@guid'			
	        , CONVERT(nvarchar(MAX),@invokingUser) AS '@invokingUser'
			, CONVERT(nvarchar(MAX),@version) AS '@version'
			, CONVERT(nvarchar(MAX),@output) AS '@output'
            , CONVERT(nvarchar(MAX),@fieldName) AS '@fieldName'
            FOR XML PATH('Params')
	    )
	    INSERT INTO DebugInfo(data, dt) VALUES(Convert(nvarchar(MAX), @Param), GETUTCDATE())
    END
    Set @output = 1
    SET @fieldName = 'Success'

    BEGIN TRY
		SET @syncDate = (SELECT TOP 1 CONVERT(DATETIME,[value]) FROM dbo.[Configuration] (NOLOCK) WHERE [configKey] = 'telemetry-last-exectime')
		;WITH CTE_Zone
		AS (	SELECT EP.[guid],
					COUNT(E.[guid]) [totalChild]
				FROM [dbo].[Entity] EP (NOLOCK) 
				INNER JOIN [dbo].[Entity] E (NOLOCK) ON EP.[guid] = E.[parentEntityGuid] AND E.[isDeleted] = 0
				WHERE EP.[guid] = @guid AND EP.[isDeleted] = 0 
				GROUP BY EP.[guid]
		)
		,CTE_DeviceCount
		AS (	SELECT EP.[guid]
						, SUM(CASE WHEN [isProvisioned] = 1 THEN 1 ELSE 0 END) [totalConnected] 
						, SUM(CASE WHEN [isProvisioned] = 0 THEN 1 ELSE 0 END) [totalDisconnected] 
				FROM [dbo].[Device] D (NOLOCK) 
				INNER JOIN [dbo].[Entity] E (NOLOCK) ON E.[guid] = D.[entityGuid] AND E.[isDeleted] = 0
				INNER JOIN [dbo].[Entity] EP (NOLOCK) ON EP.[guid] = E.[parentEntityGuid] AND EP.[isDeleted] = 0
				WHERE EP.[guid] = @guid AND EP.[isDeleted] = 0
				GROUP BY EP.[guid]
		)
		, CTE_Alerts
		AS (	SELECT EP.[guid], COUNT(I.[guid]) AS [totalAlert]
				FROM [dbo].[IOTConnectAlert] I (NOLOCK)
				INNER JOIN [dbo].[Entity] E (NOLOCK) ON E.[guid] = I.[entityGuid] AND E.[isDeleted] = 0
				INNER JOIN [dbo].[Entity] EP (NOLOCK) ON EP.[guid] = E.[parentEntityGuid] AND EP.[isDeleted] = 0
				WHERE EP.[guid] = @guid AND EP.[isDeleted] = 0 AND MONTH([eventDate]) = MONTH(GETUTCDATE()) AND YEAR([eventDate]) = YEAR(GETUTCDATE())
				GROUP BY EP.[guid]
		)
		,CTE_EnergyConsumption
		AS 
		(	SELECT EP.[guid],SUM([sum]) AS [value] 
			FROM [dbo].[TelemetrySummary_Hourwise] T (NOLOCK)
			INNER JOIN [dbo].[Device] D (NOLOCK) ON T.[deviceGuid] = D.[guid] AND D.[isDeleted] = 0
			INNER JOIN [dbo].[Entity] E (NOLOCK) ON E.[guid] = D.[entityGuid] AND E.[isDeleted] = 0
			INNER JOIN [dbo].[Entity] EP (NOLOCK) ON EP.[guid] = E.[parentEntityGuid]
			WHERE EP.[guid] = @guid AND EP.[isDeleted] = 0 AND T.[attribute] = 'currentin' AND MONTH(T.[date]) = MONTH(GETUTCDATE()) AND YEAR(T.[date]) = YEAR(GETUTCDATE())
			GROUP BY EP.[guid]
		)
		,CTE_DeviceEnergyCount
		AS (	SELECT T.[deviceGuid]
						, SUM([sum]) [energyCount]
				FROM [dbo].[TelemetrySummary_HourWise] T (NOLOCK) 
				INNER JOIN [dbo].[Device] D (NOLOCK) ON T.[deviceGuid] = D.[guid] AND D.[isDeleted] = 0
				INNER JOIN [dbo].[Entity] E (NOLOCK) ON E.[guid] = D.[entityGuid] AND E.[isDeleted] = 0
				INNER JOIN [dbo].[Entity] EP (NOLOCK) ON EP.[guid] = E.[parentEntityGuid]
				WHERE EP.[guid] = @guid AND EP.[isDeleted] = 0 AND T.[attribute] = 'currentin'
				GROUP BY T.[deviceGuid]
		)
		SELECT E.[guid]
				, ISNULL(L.[totalChild],0) AS [totalSubEntities]
				, ISNULL(A.[totalAlert],0) AS [totalAlerts]
				, ISNULL(D.[totalConnected],0) AS [totalConnected]
				, ISNULL(D.[totalDisconnected],0) AS [totalDisconnected]
				, ISNULL(D.[totalConnected],0) + ISNULL(D.[totalDisconnected],0) AS [totalDevices]
				, ISNULL(CE.[value],0) AS [totalEnergy]
				, ISNULL(MinCount.[name],'') AS [minDeviceName]
				, ISNULL(MinCount.[minCount],0) AS [minDeviceEnergyCount]
				, ISNULL(MaxCount.[name],'') AS [maxDeviceName]
				, ISNULL(MaxCount.[maxCount],0) AS [maxDeviceEnergyCount]
		FROM [dbo].[Entity] E (NOLOCK) 
		LEFT JOIN CTE_Zone L ON E.[guid] = L.[guid]
		LEFT JOIN CTE_Alerts A ON E.[guid] = A.[guid]
		LEFT JOIN CTE_DeviceCount D ON E.[guid] = D.[guid]
		LEFT JOIN CTE_EnergyConsumption CE ON E.[guid] = CE.[guid]
		LEFT JOIN 
			(SELECT	TOP	1 EP.[guid], 
				D.[uniqueId] AS [name],
				MIN([energyCount]) as [minCount]
			 FROM CTE_DeviceEnergyCount CDE 
			 INNER JOIN [dbo].[Device] D (NOLOCK) ON CDE.[deviceGuid] = D.[guid] AND D.[isDeleted] = 0
			 INNER JOIN [dbo].[Entity] E (NOLOCK) ON E.[guid] = D.[entityGuid] AND E.[isDeleted] = 0
			INNER JOIN [dbo].[Entity] EP (NOLOCK) ON EP.[guid] = E.[parentEntityGuid]
			 GROUP BY EP.[guid],D.[uniqueId]
			 ORDER BY [minCount] ASC 
			) MinCount ON MinCount.[guid] = E.[guid]
		LEFT JOIN 
			(SELECT	TOP	1 EP.[guid], 
				D.[uniqueId] AS [name],
				MAX([energyCount]) as [maxCount]
			 FROM CTE_DeviceEnergyCount CDE 
			 INNER JOIN [dbo].[Device] D (NOLOCK) ON CDE.[deviceGuid] = D.[guid] AND D.[isDeleted] = 0
			 INNER JOIN [dbo].[Entity] E (NOLOCK) ON E.[guid] = D.[entityGuid] AND E.[isDeleted] = 0
			INNER JOIN [dbo].[Entity] EP (NOLOCK) ON EP.[guid] = E.[parentEntityGuid]
			 GROUP BY EP.[guid],D.[uniqueId]
			 ORDER BY [maxCount] DESC 
			) MaxCount ON MaxCount.[guid] = E.[guid]
		WHERE E.[guid]=@guid AND E.[isDeleted]=0
		
	END TRY
	BEGIN CATCH
		DECLARE @errorReturnMessage nvarchar(MAX)

		SET @output = 0

		SELECT @errorReturnMessage =
			ISNULL(@errorReturnMessage, '') +  SPACE(1)   +
			'ErrorNumber:'  + ISNULL(CAST(ERROR_NUMBER() as nvarchar), '')  +
			'ErrorSeverity:'  + ISNULL(CAST(ERROR_SEVERITY() as nvarchar), '') +
			'ErrorState:'  + ISNULL(CAST(ERROR_STATE() as nvarchar), '') +
			'ErrorLine:'  + ISNULL(CAST(ERROR_LINE () as nvarchar), '') +
			'ErrorProcedure:'  + ISNULL(CAST(ERROR_PROCEDURE() as nvarchar), '') +
			'ErrorMessage:'  + ISNULL(CAST(ERROR_MESSAGE() as nvarchar(max)), '')
		RAISERROR (@errorReturnMessage, 11, 1)

		IF (XACT_STATE()) = -1
		BEGIN
			ROLLBACK TRANSACTION
		END
		IF (XACT_STATE()) = 1
		BEGIN
			ROLLBACK TRANSACTION
		END
		RAISERROR (@errorReturnMessage, 11, 1)
	END CATCH
END